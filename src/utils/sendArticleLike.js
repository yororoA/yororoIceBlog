/**
 * 文章点赞/取消点赞
 * @param {string} _id - 文章的 _id
 * @param {boolean} like - 是否点赞
 */
export async function sendArticleLike(_id, like) {
	const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/knowledge/like`;
	const resp = await fetch(api, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ articleId: _id, like: like })
	});
	if (!resp.ok) {
		console.error(`${like === false && '取消'}`, '文章点赞失败');
		return;
	}
	console.log(`${like === false && '取消'}`, '文章点赞成功');
}
