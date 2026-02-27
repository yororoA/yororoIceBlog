/**
 * 使用 SHA-256 对密码进行哈希
 * 这可以防止密码在传输过程中以明文形式暴露
 * 注意：这不能替代 HTTPS，HTTPS 仍然是必需的
 * @param {string} password - 明文密码
 * @returns {Promise<string>} - SHA-256 哈希后的十六进制字符串
 */
export async function hashPassword(password) {
	if (!password || typeof password !== 'string') {
		throw new Error('密码必须是有效的字符串');
	}

	// 使用 Web Crypto API 进行 SHA-256 哈希
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	
	// 将 ArrayBuffer 转换为十六进制字符串
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	
	return hashHex;
}
