// Submit registration payload as JSON to the given endpoint and return a structured response
import { hashPassword } from './encrypt';

export async function submitRegister(data, actionUrl = `${process.env.REACT_APP_SERVER_HOST}/api/register`) {
  // 对密码进行 SHA-256 哈希，避免明文传输
  const payload = { ...data };
  if (payload.password) {
    payload.password = await hashPassword(payload.password);
  }

  const resp = await fetch(actionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify(payload),
  });

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
