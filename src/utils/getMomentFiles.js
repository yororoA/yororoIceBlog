import {base64toObjectUrl} from "./base64toObjectUrl";

/*通过文件名以及请求来源获取文件
* @filenames: 文件名数组(array of filename)
* @from: 请求来源,如`moments`(source of request, such as `moments`)*/
export async function getMomentFiles(filenames, from) {
	const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/moments/files`;
	const resp = await fetch(api, {
		method:"POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body:JSON.stringify({
			filenames: filenames,
			from: from
		})
	});
	if (resp.ok){
		const files = await resp.json();
		return base64toObjectUrl(files.data);
	}
}