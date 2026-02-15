/**
 * 删除 moment
 * @param {string} momentId - moment 的 _id
 * @param {string} moment_uid - moment 作者的 uid（请求体必填，与权限校验一致）
 * @returns {Promise<{ message: string, data?: { momentId, deleted } }>}
 */
export async function deleteMoment(momentId, moment_uid) {
	const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/moments/delete`;
	const resp = await fetch(api, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ momentId, moment_uid }),
	});
	const data = await resp.json().catch(() => ({}));
	if (!resp.ok) throw new Error(data.message || '删除失败');
	return data;
}
