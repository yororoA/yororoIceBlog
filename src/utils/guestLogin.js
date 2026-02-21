/**
 * 游客登录：POST /api/guest/login，将 guest_token、guest_uid 写入 localStorage
 * 登录成功后清除正式账号的 token/uid，避免混用
 */
export async function guestLogin() {
	// 先清掉旧游客凭证，避免本次请求返回前已有请求带着旧 token 发出导致「无效 token」
	localStorage.removeItem('guest_token');
	localStorage.removeItem('guest_uid');

	// 禁用缓存，确保拿到的是本次请求的真实响应（避免拿到旧会话的 token 导致 401）
	const response = await fetch(`${process.env.REACT_APP_SERVER_HOST}/api/guest/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		cache: 'no-store',
	});
	const result = await response.json();
	if (result.message === 'ok' && result.data) {
		const { token, uid } = result.data;
		if (!token || typeof token !== 'string' || !uid || typeof uid !== 'string') {
			throw new Error('游客登录返回数据异常');
		}
		localStorage.removeItem('token');
		localStorage.removeItem('uid');
		sessionStorage.removeItem('token');
		sessionStorage.removeItem('uid');
		localStorage.setItem('guest_token', token.trim());
		localStorage.setItem('guest_uid', uid.trim());
		return result.data;
	}
	throw new Error(result.message || 'Guest login failed');
}
