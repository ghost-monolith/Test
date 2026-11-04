const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(DATA_DIR, 'events.jsonl');

fs.mkdirSync(DATA_DIR, { recursive: true });
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Accepts event metadata only. Never accept card numbers, CVV, passwords,
// real OTPs, addresses, or magnetic-stripe/track data.
const ALLOWED_EVENTS = new Set([
  'store_opened', 'product_added', 'checkout_opened',
  'training_payment_submitted', 'otp_screen_opened',
  'training_otp_submitted', 'training_otp_declined',
  'debrief_opened'
]);

app.post('/api/event', (req, res) => {
  const { participantId, event, channel, outcome, itemId } = req.body || {};
  if (typeof participantId !== 'string' ||
      !/^[A-Za-z0-9_-]{1,32}$/.test(participantId) ||
      !ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ ok: false, error: 'Invalid training event' });
  }

  const record = {
    timestamp: new Date().toISOString(),
    participantId,
    event,
    ...(typeof channel === 'string' && ['SMS_SIM', 'PUSH_SIM'].includes(channel) ? { channel } : {}),
    ...(typeof outcome === 'string' && ['accepted', 'declined', 'invalid', 'completed'].includes(outcome) ? { outcome } : {}),
    ...(typeof itemId === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(itemId) ? { itemId } : {})
  };

  fs.appendFileSync(LOG_FILE, JSON.stringify(record) + '\\n', { encoding: 'utf8' });
  res.json({ ok: true });
});

app.get('/health', (_req, res) => res.json({ ok: true, mode: 'training-simulation' }));

app.listen(PORT, () => console.log(`DARK GHOST training simulator listening on ${PORT}`));
