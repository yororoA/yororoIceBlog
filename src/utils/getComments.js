/*@commentIDs: array of comment_id
* @return: err:message; ok:{message, data}*/
export async function getComments(commentIds) {
	const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/moments/comment/get`;
	const resp = await fetch(api, {
		method: "POST",
		headers:{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({commentIds: commentIds})
	});
	const data = await resp.json();
	if (!resp.ok) return (`获取评论失败: ${data.message}`);
	return data.data.sort((a,b) => a.createdAt - b.createdAt);
}