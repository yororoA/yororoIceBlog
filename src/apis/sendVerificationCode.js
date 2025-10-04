/**
 * Send verification code to user's email via backend POST API.
 *
 * Env:
 * - REACT_APP_SERVER_HOST: backend host (with or without protocol). Example: http://localhost or http://127.0.0.1
 *   Port 9999 is appended by default as per project convention.
 *
 * Usage:
 *   import { sendVerificationCode } from '@/apis/sendVerificationCode';
 *   await sendVerificationCode({ email: 'user@example.com' });
 */

/**
 * Build full URL from env host and path
 * @param {string} path
 * @returns {string}
 */
function buildUrl(path) {
	let base = process.env.REACT_APP_SERVER_HOST || 'http://localhost';
	if (!/^https?:\/\//.test(base)) {
		base = `http://${base}`;
	}
	try {
		const u = new URL(base);
		if (!u.port) u.port = '9999';
		base = `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ''}`;
	} catch {
		// fallback: append :9999 if no port present
		if (!/:\d+$/.test(base)) base = `${base}:9999`;
	}
	return `${base}${path}`;
}

/**
 * POST to backend to send a verification code to the provided email
 * @param {{ email: string }} payload
 * @returns {Promise<any>} parsed JSON response
 */
export async function sendVerificationCode(email) {
	if (!email) {
		throw new Error('email is required');
	}

	const res = await fetch(buildUrl('/api/verification/send'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		// include credentials if backend requires cookies/session
		credentials: 'include',
		body: JSON.stringify({email}),
	});

	const text = await res.text();
	let data = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = {raw: text};
	}

	if (!res.ok) {
		const message = (data && data.message) || res.statusText || 'Request failed';
		const err = new Error(message);
		err.status = res.status;
		err.data = data;
		// throw err;
	}

	data.status = res.status;

	return data;
}

export default sendVerificationCode;
