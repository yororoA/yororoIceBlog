export function base64toObjectUrl(files) {
	const objectUrls = [];
	for (const file of files) {
		// base64 to blob
		const byteChars = atob(file.base64);
		const byteNumber = new Array(byteChars.length);
		for (let i = 0; i < byteChars.length; i++) {
			byteNumber[i] = byteChars.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumber);
		const blob = new Blob([byteArray], {type: file.mime});

		// blob to objectUrl
		const url = URL.createObjectURL(blob);
		objectUrls.push({url, filename: file.filename, revoke: () => URL.revokeObjectURL(url)});
	}
	return objectUrls;
}