export async function getMoments() {
	const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/moments/get?isEditing=false`;
	const resp = await fetch(api, {
		method: 'GET',
	});
	// console.log(await resp.json())
	const data = await resp.json();
	if (resp.ok) {
		// const {uid,username, comments, content, title, createdAt, _id, likes, filenames}
		const rd = [];
		for (const datum of data.data) {
			const {uid, username, comments, content, title, createdAt, _id, likes, filenames} = datum;
			rd.push({
				uid, username, title, content, _id, likes, comments,
				createdAt: new Date(createdAt),
				filenames: Object.keys(filenames)
			});
		}
		return rd;
	} else {
		console.error(`${resp.status}: ${data.message}`);
	}
}
