export async function getBlogInfo() {
  const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/about`;
  const response = await fetch(api, { method: 'GET' });
  
  if (!response.ok) {
    throw new Error('获取博客信息失败');
  }
  
  const result = await response.json();
  return result.data || {};
}

export async function updateBlogInfo(blogData) {
  const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/about`;
  const response = await fetch(api, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(blogData)
  });
  
  if (!response.ok) {
    throw new Error('更新博客信息失败');
  }
  
  const result = await response.json();
  return result;
}
