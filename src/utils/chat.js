const API = `${process.env.REACT_APP_SERVER_HOST}/api/chat`;

export async function getConversations() {
	const resp = await fetch(`${API}/conversations`);
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.message || '获取会话列表失败');
	return data.data || [];
}

export async function getHistory({ type, userId, page = 1, limit = 15 }) {
	const params = new URLSearchParams({ type, page: String(page), limit: String(limit) });
	if (userId) params.set('userId', userId);
	const resp = await fetch(`${API}/history?${params}`);
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.message || '获取历史失败');
	return { items: data.data || [], hasMore: !!data.hasMore };
}

export async function sendMessage({ type, targetUserId, text, imgurl = [], replyto = '' }) {
	const imgurlArr = Array.isArray(imgurl) ? imgurl : (imgurl ? [imgurl] : []);
	const resp = await fetch(`${API}/send`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type, targetUserId, text, imgurl: imgurlArr, replyto }),
	});
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.message || '发送失败');
	return data.data;
}

export async function uploadChatMedia(files) {
	const formData = new FormData();
	for (let i = 0; i < files.length; i++) {
		formData.append('files', files[i]);
	}
	const resp = await fetch(`${API}/upload`, { method: 'POST', body: formData });
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.message || '上传失败');
	return data.data?.urls || [];
}

export async function hasPrivateHistory(userId) {
	const resp = await fetch(`${API}/hasPrivate?userId=${encodeURIComponent(userId)}`);
	const data = await resp.json();
	if (!resp.ok) throw new Error(data.message || '检查失败');
	return !!data.data?.hasHistory;
}
