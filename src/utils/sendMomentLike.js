/* 将点赞信息发送给服务器
* @id: 点赞moment的_id
* @like: 布尔值,是否点赞 */
export async function sendMomentLike(_id,like){
	const api = `${process.env.REACT_APP_SERVER_HOST}/api/moments/like`;
	const resp = await fetch(api, {
		method:"POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({momentId: _id, like: like})
	});
	if (!resp.ok) {
		console.error(`${like===false && '取消'}`,'点赞失败');
		return;
	}
	console.log(`${like===false && '取消'}`,'点赞成功');
}