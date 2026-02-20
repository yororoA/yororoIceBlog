// Submit login payload as JSON to the given endpoint and return a structured response
export async function submitLogin(data, actionUrl) {
	const { username, password } = data ?? {};
	if (!username || !password) {
		throw new Error('缺少 username | password');
	}

		const resolvedUrl = actionUrl
			|| `${process.env.REACT_APP_SERVER_HOST}/api/login`;

	const resp = await fetch(resolvedUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json;charset=UTF-8',
		},
		body: JSON.stringify({ username, password }),
	});

	console.log(resp)


	const rawText = await resp.text();
	let parsed;
	try {
		parsed = JSON.parse(rawText);
	} catch {
		parsed = rawText;
	}

	return {
		status: resp.status,
		ok: resp.ok,
		data: parsed,
		headers: Object.fromEntries(resp.headers.entries()),
	};
}