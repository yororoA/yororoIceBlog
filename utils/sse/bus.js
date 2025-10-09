const clients = new Set();

function addClient(res, context = {}) {
  const client = { res, context };
  clients.add(client);
  res.on('close', () => {
    clients.delete(client);
  });
  return client;
}

function sendEvent(res, { event, data }) {
  try {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (_) {
    // ignore broken pipe
  }
}

function broadcast(event, data, filterFn) {
  for (const client of clients) {
    if (typeof filterFn === 'function' && !filterFn(client)) continue;
    sendEvent(client.res, { event, data });
  }
}

module.exports = { addClient, broadcast, sendEvent };
