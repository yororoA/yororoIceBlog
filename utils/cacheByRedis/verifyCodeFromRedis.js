const redis = require('./connectRedis');


/**
 * 验证用户提交的验证码
 * @param {string} email - 用户邮箱
 * @param {string} inputCode - 用户提交的验证码
 * @returns {boolean} - 验证结果（true 成功，false 失败）
 */
async function verifyCode(email, inputCode) {
	const codeKey = `verify:code:${email}`;
	// 1. 从 Redis 获取缓存的验证码（原子操作，避免并发场景下重复验证）
	const cachedCode = await redis.get(codeKey);

	// 2. 验证逻辑
	if (!cachedCode) {
		throw new Error('验证码已过期或未发送，请重新获取');
	}
	if (cachedCode !== inputCode) {
		// 可选：记录错误次数，超过阈值临时禁止验证（防暴力破解）
		const errorKey = `verify:error:count:${email}`;
		const errorCount = await redis.incr(errorKey);
		if (errorCount >= 5) { // 5 次错误后，10 分钟内禁止验证
			await redis.setex(errorKey, 600, errorCount);
			throw new Error('验证码错误次数过多，请 10 分钟后再试');
		}
		throw new Error('验证码错误，请重新输入');
	}

	// 3. 验证通过：删除缓存的验证码（防重复使用）
	await redis.del(codeKey);
	// 可选：删除发送频率限制（允许用户验证通过后重新发送，如注册失败后再次尝试）
	// await redis.del(`verify:send:limit:${email}`);

	return true;
}

module.exports = { verifyCode };