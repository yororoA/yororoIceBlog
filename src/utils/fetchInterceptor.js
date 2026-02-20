/* fetch 拦截器 */
const originFetch = window.fetch;

window.fetch = async function (input, init) {
	const url = input instanceof Request ? input.url : input;
	// 账户路径下不拦截（例如登录/注册）
	if (!window.location.pathname.includes('account')) {
		// 合并 headers（兼容 Headers 对象与普通对象）
		const baseHeaders = init?.headers instanceof Headers
			? Object.fromEntries(init.headers.entries())
			: (init?.headers || {});
		const headers = {...baseHeaders};

		// 附加鉴权头：游客用 Bearer + guest_uid；正式账号从 localStorage 或 sessionStorage 读 token/uid（Remember me 未勾选时在 sessionStorage）
		const guestToken = localStorage.getItem('guest_token');
		const guestUid = localStorage.getItem('guest_uid');
		const token = localStorage.getItem('token') || sessionStorage.getItem('token');
		const uid = localStorage.getItem('uid') || sessionStorage.getItem('uid');
		if (guestToken && guestUid) {
			headers.Authorization = `Bearer ${guestToken}`;
			headers.uid = guestUid;
		} else if (token) {
			headers.Authorization = `X-Token ${token}`;
			if (uid) headers.uid = uid;
		}

		const config = {
			method: init?.method || 'GET',
			...init,
			headers,
		};

		// 注意：不要在这里随意修改 body（如 JSON 字符串/表单），避免破坏调用方
		const resp = await originFetch(url, config);
		if (!resp.ok) {
			// 用 clone() 读取 body，避免消费原 resp，否则调用方再 resp.json() 会报 "body stream already read"
			let data;
			try {
				data = await resp.clone().json();
			} catch {
				data = {};
			}
			if (data.hasOwnProperty('tokenError')) {
				const wasGuestRequest = !!(guestToken && guestUid);
				if (!wasGuestRequest) {
					localStorage.removeItem('token');
					localStorage.removeItem('uid');
					sessionStorage.removeItem('token');
					sessionStorage.removeItem('uid');
					localStorage.removeItem('guest_token');
					localStorage.removeItem('guest_uid');
					window.location.href = '/account/login';
				}
			}
		}
		if (resp.headers['X-Refreshed-Token'] !== undefined) {
			const refreshed = resp.headers['X-Refreshed-Token'];
			if (localStorage.getItem('token')) localStorage.setItem('token', refreshed);
			if (sessionStorage.getItem('token')) sessionStorage.setItem('token', refreshed);
		}
		return resp;
	} else {
		// 账户相关请求直接透传
		return await originFetch(url, init);
	}
}


const fetchInterceptor = {};
export default fetchInterceptor;