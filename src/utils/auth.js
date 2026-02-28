const GUEST_DISPLAY_NAME_KEY = 'guest_display_name';

function randomLetterUsername() {
	const chars = 'abcdefghijklmnopqrstuvwxyz';
	let s = '';
	for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
	return `Guest_${s}`;
}

const USERNAME_KEY = 'username';

/** 当前用户 uid：游客用 guest_uid，否则从 localStorage 或 sessionStorage 读 uid */
export function getUid() {
	if (typeof localStorage === 'undefined') return '';
	return localStorage.getItem('guest_uid') || localStorage.getItem('uid') || sessionStorage.getItem('uid') || '';
}

/** 登录用户的 username（仅正式用户有；游客用 getGuestDisplayName） */
export function getUsername() {
	if (typeof localStorage === 'undefined' || isGuest()) return '';
	return localStorage.getItem(USERNAME_KEY) || sessionStorage.getItem(USERNAME_KEY) || '';
}

/** 是否为游客模式（仅能浏览，不能发帖/点赞/评论/删除） */
export function isGuest() {
	if (typeof localStorage === 'undefined') return false;
	// 如果有正式 token，即使残留了 guest_token 也不算游客
	const hasRealToken = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
	if (hasRealToken) return false;
	return !!localStorage.getItem('guest_token');
}

/** 获取游客展示用用户名：若未设置则生成随机名并持久化，用于 nav/chat/留言板 */
export function getGuestDisplayName() {
	if (typeof localStorage === 'undefined' || !isGuest()) return '';
	let name = localStorage.getItem(GUEST_DISPLAY_NAME_KEY);
	if (!name || !name.trim()) {
		name = randomLetterUsername();
		localStorage.setItem(GUEST_DISPLAY_NAME_KEY, name);
	}
	return name.trim();
}

/** 设置游客展示名（如留言板输入的自定义名称），将同步用于 nav/chat/留言板 */
export function setGuestDisplayName(name) {
	if (typeof localStorage === 'undefined') return;
	if (name != null && String(name).trim()) {
		localStorage.setItem(GUEST_DISPLAY_NAME_KEY, String(name).trim());
	}
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
	localStorage.removeItem(GUEST_DISPLAY_NAME_KEY);
	localStorage.removeItem(USERNAME_KEY);
	sessionStorage.removeItem(USERNAME_KEY);
}
