/* 添加评论（含回复）
 * @payload: { username?, momentId, comment, belong? }
 * - belong: 回复的目标评论 _id，不传则为顶级评论
 */
export async function addComment(payload) {
	const api = `${process.env.REACT_APP_SERVER_HOST}/api/moments/comment/post`;
	const { username, momentId, comment, belong } = payload;
	const body = { username, momentId, comment };
	if (typeof belong === 'string' && belong.length) body.belong = belong;
	const resp = await fetch(api, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = await resp.json();
	if (!resp.ok) return (`评论失败: ${data.message}`);
	return data;
}