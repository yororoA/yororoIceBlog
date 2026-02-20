import {base64toObjectUrl} from "./base64toObjectUrl";

/*通过文件名以及请求来源获取文件
* @filenames: 文件名数组(array of filename)
* @from: 请求来源,如`moments`(source of request, such as `moments`)*/
export async function getFiles(filenames, from) {
	const params = new URLSearchParams();
	params.set('from', from);
	params.set('filenames', filenames.join(','));
	const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/moments/files?${params.toString()}`;
	const resp = await fetch(api, {
		method: 'GET',
	});
	if (resp.ok){
		const files = await resp.json();
		return base64toObjectUrl(files.data);
	}
}