/* 发送评论点赞/取消点赞请求
 * @commentId: 评论 _id
 * @like: boolean 是否点赞
 * 返回：{ ok: boolean, data?: { commentId, likes, hasLiked } }
 */
export async function sendCommentLike(commentId, like) {
	const api = `${process.env.REACT_APP_SERVER_HOST}/api/moments/comment/like`;

	try {
		const resp = await fetch(api, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({commentId, like}),
		});

		const data = await resp.json().catch(() => ({}));

		if (!resp.ok) {
			console.error('评论点赞请求失败:', data?.message || resp.statusText);
			return {ok: false, data};
		}

		return {ok: true, data};
	} catch (err) {
		console.error('评论点赞请求异常:', err);
		return {ok: false, data: null};
	}
}

