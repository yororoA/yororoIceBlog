// Submit login payload as JSON to the given endpoint and return a structured response
function ensurePort9999(base) {
	let b = base || 'http://localhost';
	if (!/^https?:\/\//.test(b)) b = `http://${b}`;
	try {
		const u = new URL(b);
		if (!u.port) u.port = '9999';
		return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ''}`;
	} catch {
		// Fallback: if parsing fails, append :9999 when not present
		return /:\d+$/.test(b) ? b : `${b}:9999`;
	}
}

export async function submitLogin(data, actionUrl) {
	const { username, password } = data ?? {};
	if (!username || !password) {
		throw new Error('缺少 username | password');
	}

		const resolvedUrl = actionUrl
			|| `${ensurePort9999(process.env.REACT_APP_SERVER_HOST)}/api/login`;

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