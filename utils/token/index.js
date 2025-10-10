const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TOKEN_TTL_SEC = parseInt(process.env.TOKEN_TTL_SEC || '7200', 10); // 默认2小时
// 过期后的刷新宽限期（秒），用于鉴权中间件在 token 过期后的一小段时间内仍可换发新 token
// 注意：环境变量 TOKEN_REFRESH_WINDOW_SEC 代表“宽限期秒数”，而非“提前刷新秒数”
const TOKEN_REFRESH_WINDOW_SEC = parseInt(process.env.TOKEN_REFRESH_WINDOW_SEC || '0', 10);

function generateToken(extra = '') {
  // 32字节随机 + 时间戳 + 可选额外信息，再做一次SHA256，减少泄漏风险
  const rand = crypto.randomBytes(32).toString('hex');
  const ts = Date.now().toString(36);
  const raw = `${rand}.${ts}.${extra || ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateUID() {
  // 简单 uid：16 字节随机 + 时间戳，避免与 token 冲突
  const rand = crypto.randomBytes(8).toString('hex');
  const ts = Date.now().toString(36);
  return `u_${ts}_${rand}`;
}

function buildTokenMeta(extra = '') {
  const token = generateToken(extra);
  const now = Date.now();
  const expiresAt = new Date(now + TOKEN_TTL_SEC * 1000);
  // 允许在过期后 TOKEN_REFRESH_WINDOW_SEC 秒内进行刷新
  const refreshUntil = new Date(now + (TOKEN_TTL_SEC + TOKEN_REFRESH_WINDOW_SEC) * 1000);
  return { token, expiresAt, refreshUntil };
}

function getTokenFromRequest(req) {
  const auth = req.headers['authorization'] || '';
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ') || auth.toLowerCase().startsWith('x-token')) {
    return auth.slice(7).trim();
  }
  // 备选：自定义头
  if (req.headers['x-token']) return String(req.headers['x-token']);
  return null;
}

module.exports = { generateToken, generateUID, buildTokenMeta, getTokenFromRequest, TOKEN_TTL_SEC, TOKEN_REFRESH_WINDOW_SEC };
