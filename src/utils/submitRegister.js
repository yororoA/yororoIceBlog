// Submit registration payload as JSON to the given endpoint and return a structured response
export async function submitRegister(data, actionUrl = `${process.env.REACT_APP_SERVER_HOST}/api/register`) {
  const resp = await fetch(actionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify(data ?? {}),
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
