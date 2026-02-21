// Submit login payload as JSON to the given endpoint and return a structured response
import { hashPassword } from './encrypt';

/**
 * 提交登录请求
 * @param {Object} data - 登录数据 { username, password, isLegacy? }
 * @param {string} actionUrl - API 端点
 * @param {boolean} isLegacy - 是否为旧用户（使用原始密码，不进行 SHA-256 哈希）
 * @returns {Promise<Object>} - 响应对象
 */
export async function submitLogin(data, actionUrl, isLegacy = false) {
	const { username, password } = data ?? {};
	if (!username || !password) {
		throw new Error('缺少 username | password');
	}

	const resolvedUrl = actionUrl
		|| `${process.env.REACT_APP_SERVER_HOST}/api/login`;

	let passwordToSend;
	if (isLegacy) {
		// 旧用户：发送原始密码（不进行 SHA-256 哈希）
		// 注意：这仅在旧用户列表中的用户使用，且建议使用 HTTPS
		passwordToSend = password;
	} else {
		// 新用户：对密码进行 SHA-256 哈希，避免明文传输
		passwordToSend = await hashPassword(password);
	}

	const resp = await fetch(resolvedUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json;charset=UTF-8',
		},
		body: JSON.stringify({ username, password: passwordToSend, isLegacy }),
	});

	const rawText = await resp.text();
	let parsed;
	try {
		parsed = JSON.parse(rawText);
	} catch {
		parsed = rawText;
	}

	return {
		status: resp.status,
		ok: resp.ok,
		data: parsed,
		headers: Object.fromEntries(resp.headers.entries()),
	};
}

/**
 * 智能登录：先尝试新格式，失败则尝试旧格式
 * @param {Object} data - 登录数据 { username, password }
 * @param {string} actionUrl - API 端点
 * @returns {Promise<Object>} - 响应对象
 */
export async function submitLoginWithFallback(data, actionUrl) {
	const { username, password } = data ?? {};
	if (!username || !password) {
		throw new Error('缺少 username | password');
	}

	// 先尝试新格式（SHA-256 哈希）
	let result = await submitLogin(data, actionUrl, false);
	
	// 如果失败且提示是旧用户，尝试旧格式
	if (!result.ok && result.data?.hint) {
		console.log('尝试使用旧格式登录...');
		result = await submitLogin(data, actionUrl, true);
	}
	
	return result;
}