/*添加评论
* @payload:
* - username
* - momentId
* - comment*/
export async function addComment(payload) {
	const api = `${process.env.REACT_APP_SERVER_HOST}/api/moments/comment/post`;
	const {username, momentId, comment} = payload;
	const resp = await fetch(api, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({username, momentId, comment})
	});
	const data = await resp.json();
	if (!resp.ok) return (`评论失败: ${data.message}`);
	return data;
}