const redis = require('./connectRedis');

/**
 * 缓存验证码到 Redis
 * @param {string} email - 用户邮箱（唯一标识）
 * @param {string} code - 生成的验证码
 * @param {number} expireSec - 验证码有效期（秒），默认 300 秒（5 分钟）
 * @param {number} sendLimitSec - 发送频率限制（秒），默认 60 秒（1 分钟内最多发 1 次）
 */
async function cacheVerifyCode(email, code, expireSec = 300, sendLimitSec = 60) {
	// 1. 先检查发送频率：用 "verify:send:limit:邮箱" 作为 Key，记录发送时间
	const sendLimitKey = `verify:send:limit:${email}`;
	const isLimit = await redis.get(sendLimitKey);
	if (isLimit) {
		throw new Error(`发送频率过高，请 ${sendLimitSec} 秒后再试`);
	}

	// 2. 缓存验证码：Key 格式 "verify:code:邮箱"，Value 直接存验证码（或 JSON 字符串）
	const codeKey = `verify:code:${email}`;
	// 用 SETEX 命令：原子性设置 Key + 过期时间（避免先 SET 再 EXPIRE 的竞态问题）
	await redis.setex(codeKey, expireSec, code);

	// 3. 设置发送频率限制：Key 过期时间 = 发送频率限制时间
	await redis.setex(sendLimitKey, sendLimitSec, '1'); // Value 无意义，仅用 Key 存在性判断

	console.log(`验证码 ${code} 已缓存，邮箱 ${email}，有效期 ${expireSec} 秒`);
}

module.exports = { cacheVerifyCode };