export async function getKnowledgeArticles(params = {}) {
  const { category, keyword, page = 1, limit = 20 } = params;
  const queryParams = new URLSearchParams();
  
  if (category && category !== 'all') queryParams.append('category', category);
  if (keyword) queryParams.append('keyword', keyword);
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  const api = `${process.env.REACT_APP_SERVER_HOST}/api/knowledge?${queryParams.toString()}`;
  const response = await fetch(api, { method: 'GET' });
  
  if (!response.ok) {
    throw new Error('获取文章列表失败');
  }
  
  const result = await response.json();
  return result.data || [];
}

export async function getArticleById(id) {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/knowledge/${id}`;
  const response = await fetch(api, { method: 'GET' });
  
  if (!response.ok) {
    throw new Error('获取文章失败');
  }
  
  const result = await response.json();
  return result.data;
}

export async function createArticle(articleData) {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/knowledge`;
  const response = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(articleData)
  });
  
  if (!response.ok) {
    throw new Error('创建文章失败');
  }
  
  const result = await response.json();
  return result.data;
}

export async function updateArticle(id, articleData) {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/knowledge/${id}`;
  const response = await fetch(api, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(articleData)
  });
  
  if (!response.ok) {
    throw new Error('更新文章失败');
  }
  
  const result = await response.json();
  return result.data;
}

export async function deleteArticle(id) {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/knowledge/${id}`;
  const response = await fetch(api, { method: 'DELETE' });
  
  if (!response.ok) {
    throw new Error('删除文章失败');
  }
  
  const result = await response.json();
  return result;
}

export async function getCategories() {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/knowledge/meta/categories`;
  const response = await fetch(api, { method: 'GET' });
  
  if (!response.ok) {
    throw new Error('获取分类列表失败');
  }
  
  const result = await response.json();
  return result.data || [];
}

export async function getArticleLikesList() {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/knowledge/liked`;
  const resp = await fetch(api, { method: 'GET' });
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.data || [];
}

export async function incrementArticleView(articleId) {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/knowledge/view`;
  try {
    await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId })
    });
  } catch (e) {
    console.error('incrementArticleView failed', e);
  }
}
