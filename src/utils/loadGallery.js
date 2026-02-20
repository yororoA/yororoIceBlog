import { guestLogin } from './guestLogin';
import { isGuest } from './auth';

let continueFrom = null;

/** 重置分页游标（在重新加载 gallery 时调用） */
export function resetGalleryCursor() {
	continueFrom = null;
}

/**
 * 获取 gallery 文件，需认证（拦截器会自动附加 Authorization + uid）
 * 只读取一次 response body，避免 "body stream already read"
 * @param loadNums 本次加载数量
 * @param retrying 内部用，401 时重试一次
 */
export async function loadGallery(loadNums = 20, retrying = false) {
	const base = process.env.REACT_APP_SERVER_HOST;
	const params = new URLSearchParams();
	if (continueFrom) params.append('continueFrom', continueFrom);
	if (loadNums !== 20) params.append('loadNums', String(loadNums));
	const api = `${base}/api/gallery/get?${params.toString()}`;

	const resp = await fetch(api, { method: 'GET' });

	if (resp.status === 401 && isGuest() && !retrying) {
		localStorage.removeItem('guest_token');
		localStorage.removeItem('guest_uid');
		try {
			await guestLogin();
			return loadGallery(loadNums, true);
		} catch (e) {
			console.error('Gallery 401 后重新游客登录失败:', e);
			throw new Error('Token 已过期，请重新登录');
		}
	}

	if (!resp.ok) {
		let message = `请求失败: ${resp.status}`;
		try {
			const errBody = await resp.json();
			message = errBody.message || message;
		} catch {}
		throw new Error(message);
	}

	// 只读取一次 body
	const result = await resp.json();
	if (result.message === 'ok') {
		continueFrom = result.data.breakpoint;
		return result.data;
	}
	throw new Error(result.message || '未知错误');
}