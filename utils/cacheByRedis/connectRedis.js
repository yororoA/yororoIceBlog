const Redis = require('ioredis');
const path = require('path');
// 从项目根目录加载 .env（utils/cacheByRedis -> ../../.. => backend/.env）
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });


const redis = new Redis({
	host: process.env.HOST,
	port: 6379,
	password: process.env.REDIS_PASS, // 生产环境必须设置密码
	db: 1 // 建议用独立 DB 存储验证码（如 DB1），避免与业务缓存混淆
});

module.exports = redis;