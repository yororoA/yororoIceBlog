export async function getArchiveData(params = {}) {
  const { type, year, page = 1, limit = 50 } = params;
  const queryParams = new URLSearchParams();
  
  if (type && type !== 'all') queryParams.append('type', type);
  if (year && year !== 'all') queryParams.append('year', year);
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/archive?${queryParams.toString()}`;
  const response = await fetch(api, { method: 'GET' });
  
  if (!response.ok) {
    throw new Error('获取归档数据失败');
  }
  
  const result = await response.json();
  return result.data || [];
}

export async function getArchiveStats() {
  const api = `${process.env.REACT_APP_SERVER_HOST}:9999/api/archive/stats`;
  const response = await fetch(api, { method: 'GET' });
  
  if (!response.ok) {
    throw new Error('获取统计信息失败');
  }
  
  const result = await response.json();
  return result.data || {};
}
