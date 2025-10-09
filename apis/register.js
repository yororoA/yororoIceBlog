const express = require('express');
const router = express.Router();

const { verifyCode } = require('../utils/cacheByRedis/verifyCodeFromRedis');
const { hashPassword } = require('../utils/encrypt');
const { buildTokenMeta, generateUID } = require('../utils/token');
const { connectMongo } = require('../utils/db/mongoose');
const User = require('../models/user');

// POST /api/register
// 接口入参: { username, password, email, verificationCode }
router.post('/', async (req, res) => {
  // console.log(req.body);
  console.log(req);
  try {
    const { username, password, email, verificationCode } = req.body || {};
    if (!username || !password || !email || !verificationCode) {
      return res.status(400).json({ message: '缺少必填项：username、password、email、verificationCode' });
    }

    // 1. 校验验证码（包含过期与不一致场景）
    try {
      await verifyCode(email, verificationCode);
    } catch (e) {
      return res.status(400).json({ message: e?.message || '验证码无效或已过期' });
    }

  // 2. 生成 token 与 uid；加密密码
  const { token, expiresAt: tokenExpiresAt, refreshUntil: tokenRefreshUntil } = buildTokenMeta(email);
  const uid = generateUID();
  const hashedPwd = await hashPassword(password);

    // 3. 写入 MongoDB（若库/集合不存在会自动创建）
    await connectMongo();

    // 检测用户名或邮箱是否已存在
    const exists = await User.findOne({ $or: [{ username }, { email }] }).lean();
    if (exists) {
      return res.status(409).json({ message: '用户名或邮箱已存在' });
    }

  await User.create({ username, password: hashedPwd, email, uid, token, tokenExpiresAt, tokenRefreshUntil });

  // 4. 返回 token 与 uid
  return res.status(201).json({ message: '注册成功', token, uid });
  } catch (err) {
    console.error('注册失败:', err);
    return res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
