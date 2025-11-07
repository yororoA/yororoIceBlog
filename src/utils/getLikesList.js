export async function getLikesList(type='moments'){
	const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/${type}/liked`;
	const resp = await fetch(api, {
		method: 'GET',
	});
	if (!resp.ok)return [];
	const data = await resp.json();
	return data.data;
}