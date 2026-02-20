let abortCtrl;

// 建立与服务器的server->client单向长连接,用于实时更新文章/评论列表
export async function connectSSE(dispatch) {
	if (abortCtrl !== undefined) disconnectSSE();

	const url = `${process.env.REACT_APP_SERVER_HOST}/api/sse/subscribe`;
	abortCtrl = new AbortController();
	try {
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				// 'Authorization'
				// 'uid': currentUid, // 可选：用于后端做过滤
				'Accept': 'text/event-stream',
			},
			signal: abortCtrl.signal,
			// Cookie：
			// credentials: 'include',
		});

		if (!res.ok) {
			console.error('SSE connect failed', res.status, res.statusText);
			retry(dispatch);
			return Promise.reject();
		}

		const reader = res.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let buffer = '';

		while (true) {
			const {value, done} = await reader.read();
			if (done) {
				break;
			}
			buffer += decoder.decode(value, {stream: true});

			// 按 SSE 规范按双换行分帧
			let idx;
			while ((idx = buffer.indexOf('\n\n')) >= 0) {
				const rawEvent = buffer.slice(0, idx);
				buffer = buffer.slice(idx + 2);

				// 解析 event 与 data 行
				const lines = rawEvent.split('\n');
				let eventName = 'message';
				let data = '';
				for (const line of lines) {
					if (line.startsWith('event:')) {
						eventName = line.slice(6).trim();
					} else if (line.startsWith('data:')) {
						const part = line.slice(5).trim();
						data += part;
					}
				}
				if (data) {
					try {
						const payload = JSON.parse(data);
						handleEvent(eventName, payload, dispatch);
					} catch {
						console.warn('non-json data', eventName, data);
					}
				}
			}
		}
	} catch (e) {
		if (e.name !== 'AbortError') {
			console.warn('SSE error', e);
			retry(dispatch);
			return Promise.reject('SSE error');
		}
	}
}

function handleEvent(eventName, payload, dispatch) {
	switch (eventName) {
		case 'hello':
			// payload: { message: 'connected' }
			break;
		case 'moment':
			// payload: { type: 'moment.new'|'moment.delete', data: ... }
			dispatch(payload);
			break;
		case 'comment':
			// payload: { type: 'comment.new', data: { _id, momentId, uid, username, content, createdAt } }
			dispatch(payload);
			break;
		case 'moment-like':
			// payload: { type: 'moment.like', data: { momentId, likes, uid } }
			dispatch(payload);
			break;
		case 'comment-like':
			// payload: { type: 'comment.like', data: { commentId, likes, uid } }
			dispatch(payload);
			break;
		case 'token':
			// payload: { type: 'token.refresh', data: { token, expiresAt, refreshUtil} }
			localStorage.setItem('token', payload.data.token);
			break;
		default:
			// 其他事件
			break;
	}
}

let retryTimer;

function retry(dispatch) {
	clearTimeout(retryTimer);
	// 简单退避
	retryTimer = setTimeout(() => connectSSE(dispatch), 2000);
}

export function disconnectSSE() {
	try {
		abortCtrl?.abort();
	} catch {
	}
	clearTimeout(retryTimer);
}

// window.addEventListener('beforeunload', disconnectSSE);

// 启动连接
// connectSSE();