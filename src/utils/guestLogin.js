/**
 * 游客登录：POST /api/guest/login，将 guest_token、guest_uid 写入 localStorage
 * 登录成功后清除正式账号的 token/uid，避免混用
 */
export async function guestLogin() {
	const response = await fetch(`${process.env.REACT_APP_SERVER_HOST}/api/guest/login`, {
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
