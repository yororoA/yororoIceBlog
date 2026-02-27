const API = `${process.env.REACT_APP_SERVER_HOST}/api/links`;
const ADMIN_API = `${process.env.REACT_APP_SERVER_HOST}/api/admin/links`;

/**
 * 从后端获取链接列表
 * @returns {Promise<Array<{ _id?: string, name: string, description?: string, url: string, imgurl?: string, category: string }>>}
 */
export async function getLinks() {
  const resp = await fetch(API, { method: 'GET' });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error('获取链接失败:', data?.message || resp.statusText);
    return [];
  }
  return data.data || [];
}

/**
 * 新增链接（管理员）
 */
export async function createLink(body) {
  const resp = await fetch(ADMIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.message || '创建失败');
  return data.data;
}

/**
 * 更新链接（管理员）
 */
export async function updateLink(id, body) {
  const resp = await fetch(`${ADMIN_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.message || '更新失败');
  return data.data;
}

/**
 * 删除链接（管理员）
 */
export async function deleteLink(id) {
  const resp = await fetch(`${ADMIN_API}/${id}`, { method: 'DELETE' });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.message || '删除失败');
}
