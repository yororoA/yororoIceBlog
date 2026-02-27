/**
 * 递增 moment 的浏览量
 * @param {string} momentId
 */
export async function incrementMomentView(momentId) {
  const api = `${process.env.REACT_APP_SERVER_HOST}/api/moments/view`;
  try {
    await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ momentId })
    });
  } catch (e) {
    console.error('incrementMomentView failed', e);
  }
}
