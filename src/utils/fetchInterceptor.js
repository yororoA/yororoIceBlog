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

		// 附加鉴权头
		const token = localStorage.getItem('token');
		if (token) headers.Authorization = `X-Token ${token}`;
		const uid = localStorage.getItem('uid');
		if (uid) headers.uid = uid;

		const config = {
			method: init?.method || 'GET',
			...init,
			headers,
		};

		// console.log(config)

		// 注意：不要在这里随意修改 body（如 JSON 字符串/表单），避免破坏调用方
		const resp = await originFetch(url, config);
		if (!resp.ok) {
			// 可根据状态码定向处理（此处保留原逻辑）
			const data = await resp.json();
			if (data.message.includes('token')){
				localStorage.removeItem('token');
				localStorage.removeItem('uid');
				window.location.href = '/account/login';
			}
		}
		return resp;
	} else {
		// 账户相关请求直接透传
		return await originFetch(url, init);
	}
}


const fetchInterceptor = {};
export default fetchInterceptor;