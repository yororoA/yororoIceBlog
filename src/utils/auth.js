/** 当前用户 uid：游客用 guest_uid，否则从 localStorage 或 sessionStorage 读 uid */
export function getUid() {
	if (typeof localStorage === 'undefined') return '';
	return localStorage.getItem('guest_uid') || localStorage.getItem('uid') || sessionStorage.getItem('uid') || '';
}

/** 是否为游客模式（仅能浏览，不能发帖/点赞/评论/删除） */
export function isGuest() {
	if (typeof localStorage === 'undefined') return false;
	return !!localStorage.getItem('guest_token');
}

/** 登出：清除 token/uid/游客凭证（含 localStorage 与 sessionStorage），跳转由调用方处理 */
export function logout() {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem('token');
	localStorage.removeItem('uid');
	sessionStorage.removeItem('token');
	sessionStorage.removeItem('uid');
	localStorage.removeItem('guest_token');
	localStorage.removeItem('guest_uid');
}
