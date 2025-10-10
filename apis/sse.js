const express = require('express');
const router = express.Router();
const { addClient, sendEvent } = require('../utils/sse/bus');
const { connectMongo } = require('../utils/db/mongoose');
const User = require('../models/user');
const { buildTokenMeta } = require('../utils/token');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// token 生命周期（秒）与“提前刷新”秒数
// const TOKEN_TTL_SEC = parseInt(process.env.TOKEN_TTL_SEC || '7200', 10); // 默认2小时
// 提前刷新窗口（秒）：优先使用 TOKEN_REFRESH_LEAD_SEC；兼容历史将 TOKEN_REFRESH_WINDOW_SEC 误作提前刷新秒数的用法
const TOKEN_REFRESH_LEAD_SEC = parseInt(process.env.TOKEN_REFRESH_LEAD_SEC || '3600', 10);
const EARLY_REFRESH_MS = TOKEN_REFRESH_LEAD_SEC * 1000;
const HEARTBEAT_MS = Number(process.env.SSE_HEARTBEAT_MS || 25000); // 默认25s
// 统一的“提前刷新”时间窗口（毫秒）
const LEAD_MS = EARLY_REFRESH_MS;

function scheduleTokenRefresh(res, { uid, token, tokenExpiresAt, tokenRefreshUntil }) {
  if (!uid || !token || !tokenExpiresAt) return null;

  // 使用单一 close 监听器，清理“当前”定时器，避免重复添加监听导致内存泄漏告警
  let currentTimer = null;
  const onClose = () => {
    if (currentTimer) clearTimeout(currentTimer);
  };
  // 只监听一次 close；多次计划只更新 currentTimer
  res.once('close', onClose);

  async function plan(nextToken, expiresAt, refreshUntil) {
    const now = Date.now();
    const expMs = new Date(expiresAt).getTime();
    // 如超过允许刷新窗口（refreshUntil），不再继续计划
    if (refreshUntil) {
      const rUntil = new Date(refreshUntil).getTime();
      if (Number.isFinite(rUntil) && now > rUntil) {
        return null;
      }
    }

    const tgt = expMs - LEAD_MS; // 提前 LEAD_MS 时间
    const delay = Math.max(0, tgt - now);

    // 如连接已关闭，res.write 会抛错，被外层 try 捕获忽略
    currentTimer = setTimeout(async () => {
      try {
        await connectMongo();
        // 再次确认用户存在并获取最新 email 与 token 信息
        const latest = await User.findOne({ uid }, { email: 1, token: 1, tokenExpiresAt: 1, tokenRefreshUntil: 1, _id: 0 }).lean();
        if (!latest) return;

        // 只有当数据库中的 token 仍等于我们计划时的 token，才执行刷新，避免多连接重复刷新
        const shouldRefresh = String(latest.token) === String(nextToken);
        let newTokenMeta = null;
        if (shouldRefresh) {
          newTokenMeta = buildTokenMeta(latest.email);
          const upd = await User.updateOne(
            { uid, token: nextToken },
            {
              $set: {
                token: newTokenMeta.token,
                tokenExpiresAt: newTokenMeta.expiresAt,
                tokenRefreshUntil: newTokenMeta.refreshUntil,
              }
            }
          );
          if (upd.modifiedCount === 0) {
            // 并发下可能已被其他连接刷新，回退为读取最新
            newTokenMeta = {
              token: latest.token,
              expiresAt: latest.tokenExpiresAt,
              refreshUntil: latest.tokenRefreshUntil,
            };
          }
        } else {
          // 已被其他地方更新，沿用数据库最新
          newTokenMeta = {
            token: latest.token,
            expiresAt: latest.tokenExpiresAt,
            refreshUntil: latest.tokenRefreshUntil,
          };
        }

        // 通过 SSE 仅向该连接推送新的 token 信息
        sendEvent(res, {
          event: 'token',
          data: {
            type: 'token.refresh', data: {
              token: newTokenMeta.token,
              expiresAt: newTokenMeta.expiresAt,
              refreshUntil: newTokenMeta.refreshUntil,
            }
          }
        });

        // 基于新 token 再次安排下一次刷新
        plan(newTokenMeta.token, newTokenMeta.expiresAt, newTokenMeta.refreshUntil);
      } catch (_) {
        // 连接或更新失败时静默退出本轮，等待客户端重连
      }
    }, delay);

    // 返回供上层需要时管理（当前不复用）
    return currentTimer;
  }

  return plan(token, tokenExpiresAt, tokenRefreshUntil);
}

// GET /api/sse/subscribe
router.get('/subscribe', async (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // CORS allow same as app.js; additional headers handled by app middleware

  // Flush headers
  res.flushHeaders?.();

  // Keep connection alive + 心跳
  res.write(': ok\n\n');
  const heartbeat = setInterval(() => {
    try { res.write(`: keepalive ${Date.now()}\n\n`); } catch (_) { /* 断开后会触发 close */ }
  }, HEARTBEAT_MS);

  // Track client（从鉴权中获取 uid）
  const uid = req.user?.uid || req.headers['uid'];
  const context = { uid };
  addClient(res, context);

  // Optional: send hello event
  sendEvent(res, { event: 'hello', data: { message: 'connected' } });

  // 启动 token 提前刷新逻辑（默认 1 小时，或由 TOKEN_REFRESH_LEAD_SEC 配置）
  try {
    await connectMongo();
    const user = await User.findOne(
      { uid },
      { token: 1, tokenExpiresAt: 1, tokenRefreshUntil: 1, _id: 0 }
    ).lean();

    if (user && user.token && user.tokenExpiresAt) {
      const now = Date.now();
      const expMs = new Date(user.tokenExpiresAt).getTime();
      const { tokenExpiresAt, tokenRefreshUntil } = user;
      if (expMs - now <= LEAD_MS) {
        // 已进入提前窗口，触发一次刷新再安排下一次
        const fake = { uid, token: user.token, tokenExpiresAt: tokenExpiresAt, tokenRefreshUntil: tokenRefreshUntil };
        scheduleTokenRefresh(res, fake);
      } else {
        scheduleTokenRefresh(res, { uid, token: user.token, tokenExpiresAt: tokenExpiresAt, tokenRefreshUntil: tokenRefreshUntil });
      }
    }
  } catch (_) { }

  // 断开清理心跳
  res.on('close', () => clearInterval(heartbeat));
});

module.exports = router;
