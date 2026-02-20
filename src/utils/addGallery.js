// todo: 添加图片
export async function addGallery(payload) {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/gallery/post`;
  await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}