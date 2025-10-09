const express = require('express');
const router = express.Router();

const { comparePassword } = require('../utils/encrypt');
const { buildTokenMeta } = require('../utils/token');
const { connectMongo } = require('../utils/db/mongoose');
const User = require('../models/user');

// POST /api/login
// 入参: { username, password }
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: '缺少必填项：username、password' });
    }

    await connectMongo();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const { token, expiresAt, refreshUntil } = buildTokenMeta(user.email);
    user.token = token;
    user.tokenExpiresAt = expiresAt;
    user.tokenRefreshUntil = refreshUntil;
    await user.save();

    return res.status(200).json({ message: '登录成功', token, uid: user.uid });
  } catch (err) {
    console.error('登录失败:', err);
    return res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
