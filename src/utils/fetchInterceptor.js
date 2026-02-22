/* fetch 拦截器 */
const originFetch = window.fetch;

window.fetch = async function (input, init) {
	const url = input instanceof Request ? input.url : input;
	const resolvedUrl = new URL(url, window.location.origin);
	const backendOrigin = process.env.REACT_APP_SERVER_HOST
		? new URL(process.env.REACT_APP_SERVER_HOST, window.location.origin).origin
		: window.location.origin;
	const isOwnApi = resolvedUrl.origin === window.location.origin || resolvedUrl.origin === backendOrigin;
	// 账户路径下不拦截（例如登录/注册）
	if (!window.location.pathname.includes('account') && isOwnApi) {
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
		
		// 先处理token刷新（无论响应是否成功，都可能返回新token）
		// 处理token刷新：支持正式用户和游客用户
		const hasRefreshedToken = resp.headers.get('X-Refreshed-Token');
		if (hasRefreshedToken) {
			const refreshed = hasRefreshedToken;
			const wasGuestRequest = !!(guestToken && guestUid);
			
			if (wasGuestRequest) {
				// 游客token刷新：更新guest_token
				localStorage.setItem('guest_token', refreshed);
				console.log('[Fetch Interceptor] 已更新游客token');
			} else {
				// 正式用户token刷新：更新token
				if (localStorage.getItem('token')) localStorage.setItem('token', refreshed);
				if (sessionStorage.getItem('token')) sessionStorage.setItem('token', refreshed);
				console.log('[Fetch Interceptor] 已更新用户token');
			}
		}
		
		// 处理401错误：如果token已刷新，则不处理；否则清理token并跳转登录页
		if (!resp.ok && resp.status === 401 && !hasRefreshedToken) {
			// 用 clone() 读取 body，避免消费原 resp，否则调用方再 resp.json() 会报 "body stream already read"
			let data;
			try {
				data = await resp.clone().json();
			} catch {
				data = {};
			}
			
			// 401错误且没有token刷新，清理所有token并跳转登录页
			if (data.hasOwnProperty('tokenError') || resp.status === 401) {
				// 清理所有token和uid
				localStorage.removeItem('token');
				localStorage.removeItem('uid');
				sessionStorage.removeItem('token');
				sessionStorage.removeItem('uid');
				localStorage.removeItem('guest_token');
				localStorage.removeItem('guest_uid');
				
				console.log('[Fetch Interceptor] 401错误，已清理token，跳转登录页');
				// 避免重复跳转
				if (!window.location.pathname.includes('/account/login')) {
					window.location.href = '/account/login';
				}
			}
		}
		return resp;
	} else {
		// 账户相关请求、第三方请求直接透传（避免 CORS 预检被自定义头触发）
		return await originFetch(url, init);
	}
}


const fetchInterceptor = {};
export default fetchInterceptor;