/**
 * Send verification code to user's email via backend POST API.
 *
 * Env:
 * - REACT_APP_SERVER_HOST: backend host (with protocol). Example: https://yororoiceblogbackend.onrender.com
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
	const base = process.env.REACT_APP_SERVER_HOST || 'http://localhost';
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
