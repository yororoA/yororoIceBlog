const express = require('express');
const router = express.Router();
const { addClient, sendEvent } = require('../utils/sse/bus');

// GET /api/sse/subscribe
router.get('/subscribe', (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // CORS allow same as app.js; additional headers handled by app middleware

  // Flush headers
  res.flushHeaders?.();

  // Keep connection alive
  res.write(': ok\n\n');

  // Track client
  const context = { uid: req.headers['uid'] };
  addClient(res, context);

  // Optional: send hello event
  sendEvent(res, { event: 'hello', data: { message: 'connected' } });
});

module.exports = router;
