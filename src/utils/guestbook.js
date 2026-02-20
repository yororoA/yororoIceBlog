const API = `${process.env.REACT_APP_SERVER_HOST}:9999/api/guestbook`;

export async function getGuestbookComments() {
  const resp = await fetch(API);
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error('获取留言失败:', data?.message || resp.statusText);
    return [];
  }
  return data.data || [];
}

export async function postGuestbookComment(content) {
  const resp = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error('发布留言失败:', data?.message || resp.statusText);
    return { success: false };
  }
  return data;
}
