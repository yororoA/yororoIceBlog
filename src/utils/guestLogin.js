function ensurePort9999(base) {
	let b = base || 'http://localhost';
	if (!/^https?:\/\//.test(b)) b = `http://${b}`;
	try {
		const u = new URL(b);
		if (!u.port) u.port = '9999';
		return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ''}`;
	} catch {
		return /:\d+$/.test(b) ? b : `${b}:9999`;
	}
}

/**
 * 游客登录：POST /api/guest/login，将 guest_token、guest_uid 写入 localStorage
 * 登录成功后清除正式账号的 token/uid，避免混用
 */
export async function guestLogin() {
	const base = ensurePort9999(process.env.REACT_APP_SERVER_HOST);
	const response = await fetch(`${base}/api/guest/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	});
	const result = await response.json();
	if (result.message === 'ok') {
		const { token, uid, expiresAt } = result.data;
		localStorage.removeItem('token');
		localStorage.removeItem('uid');
		localStorage.setItem('guest_token', token);
		localStorage.setItem('guest_uid', uid);
		return result.data;
	}
	throw new Error(result.message || 'Guest login failed');
}
