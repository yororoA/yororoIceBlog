const { connectMongo } = require('../utils/db/mongoose');
const User = require('../models/user');
const { getTokenFromRequest, buildTokenMeta } = require('../utils/token');

// 排除无需鉴权的路径前缀
const EXCLUDE_PREFIXES = [
  '/api/register',
  '/api/login',
  '/api/verification',
  // 公开读取已发布 moments 列表
  '/api/moments/get',
];

module.exports = async function authMiddleware(req, res, next) {
  try {
    const path = req.path || req.url || '';
    if (EXCLUDE_PREFIXES.some(prefix => path.startsWith(prefix))) {
      return next();
    }


    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: '未提供 token' , tokenError: true});
    }

    await connectMongo();
    const user = await User.findOne({ token }).lean();
    if (!user) {
      return res.status(401).json({ message: `无效 token: ${token}` , tokenError: true});
    }

    const now = new Date();
    if (now <= new Date(user.tokenExpiresAt)) {
      // 有效期内
      req.user = { uid: user.uid, username: user.username, email: user.email };
      return next();
    }

    // 过期但在刷新窗口内：派发新 token
    if (now <= new Date(user.tokenRefreshUntil)) {
      const { token: newToken, expiresAt, refreshUntil } = buildTokenMeta(user.email);
      await User.updateOne({ uid: user.uid }, {
        $set: {
          token: newToken,
          tokenExpiresAt: expiresAt,
          tokenRefreshUntil: refreshUntil,
        }
      });
      res.setHeader('X-Refreshed-Token', newToken);
      req.user = { uid: user.uid, username: user.username, email: user.email };
      return next();
    }

    // 完全过期
    return res.status(401).json({ message: 'token 已过期，请重新登录' , tokenError: true});
  } catch (err) {
    console.error('auth middleware error', err);
    return res.status(500).json({ message: '鉴权失败' });
  }
}
