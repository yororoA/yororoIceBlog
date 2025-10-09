const express = require('express');
const router = express.Router();

const { cacheVerifyCode } = require('../utils/cacheByRedis/cacheByRedis');
const genVerificationCode = require('../utils/cacheByRedis/verificationCode');
const { Client } = require('../utils/sendmail/sendmail');

// POST /api/verification/send
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: '缺少 email' });
    }

    const code = genVerificationCode();
    await cacheVerifyCode(email, code);
    await Client.main([email, code]);

    return res.status(200).json({ message: '验证码已发送', email });
  } catch (err) {
    const message = err?.message || '发送验证码失败';
    if (/频率/.test(message)) {
      return res.status(429).json({ message });
    }
    return res.status(500).json({ message });
  }
});

module.exports = router;
