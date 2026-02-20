export async function getMoments() {
	const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/moments/get?isEditing=false`;
	const resp = await fetch(api, {
		method: 'GET',
	});
	// console.log(await resp.json())
	const data = await resp.json();
	
	if (resp.ok) {
		// const {uid,username, comments, content, title, createdAt, _id, likes, filenames, updatedAt}
		const rd = [];
		for (const datum of data.data) {
			const {uid, username, comments, content, title, createdAt, _id, likes, views, filenames, updatedAt} = datum;
			rd.push({
				uid, username, title, content, _id, likes, views,  comments,
				createdAt: new Date(createdAt),
				updatedAt: new Date(updatedAt),
				filenames: filenames===undefined?[]:Object.keys(filenames)
			});
		}
		return rd.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	} else {
		console.error(`${resp.status}: ${data.message}`);
	}
}
