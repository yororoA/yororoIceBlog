import {base64toObjectUrl} from "./base64toObjectUrl";

/*通过文件名以及请求来源获取文件
* @filenames: 文件名数组(array of filename)
* @from: 请求来源,如`moments`(source of request, such as `moments`)*/
export async function getFiles(filenames, from) {
	const params = new URLSearchParams();
	params.set('from', from);
	params.set('filenames', filenames.join(','));
	const api = `${process.env.REACT_APP_SERVER_HOST}/api/moments/files?${params.toString()}`;
	const resp = await fetch(api, {
		method: 'GET',
	});
	if (resp.ok){
		const files = await resp.json();
		const items = files.data || [];
		// 如果后端返回的是 Cloudinary URL（含 url 字段），直接使用
		if (items.length > 0 && items[0].url) {
			return items.map(item => ({
				url: item.url,
				filename: item.filename,
				revoke: () => {}, // Cloudinary URL 无需 revoke
			}));
		}
		// 兼容旧版 base64 格式
		return base64toObjectUrl(items);
	}
}