const express = require('express');
const path    = require('path');
const { Client, Environment } = require('square');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SQUARE CLIENT ──────────────────────────────────────────────────────────
const sq = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: process.env.SQUARE_ENV === 'production'
    ? Environment.Production
    : Environment.Sandbox,
});

// Prices in cents as BigInt — required by Square Node SDK
const PRICES = {
  basic:      1999n,
  exclusive:  2999n,
  premium:    4999n,
  girls_only: 2999n,
  get_wins:   2999n,
  no_ban:     1999n,
  all_in_one: 4999n,
};

const PROMOS = { FUEGO: 0.15 };

// ── CRYPTO WALLETS ─────────────────────────────────────────────────────────
const COINS = [
  { coin: 'BTC',  label: 'Bitcoin',       addr: process.env.CRYPTO_BTC        || '' },
  { coin: 'ETH',  label: 'Ethereum',      addr: process.env.CRYPTO_ETH        || '' },
  { coin: 'USDT', label: 'USDT (TRC-20)', addr: process.env.CRYPTO_USDT_TRC20 || '' },
  { coin: 'LTC',  label: 'Litecoin',      addr: process.env.CRYPTO_LTC        || '' },
  { coin: 'SOL',  label: 'Solana',        addr: process.env.CRYPTO_SOL        || '' },
].filter(c => c.addr.length > 0);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// ── /api/config — safe to expose (no secrets) ─────────────────────────────
app.get('/api/config', (_req, res) => {
  res.json({
    appId:      process.env.SQUARE_APP_ID      || '',
    locationId: process.env.SQUARE_LOCATION_ID || '',
    env:        process.env.SQUARE_ENV === 'production' ? 'production' : 'sandbox',
  });
});

// ── /api/crypto ────────────────────────────────────────────────────────────
app.get('/api/crypto', (_req, res) => res.json(COINS));

// ── /api/pay — SQUARE_ACCESS_TOKEN never leaves this file ─────────────────
app.post('/api/pay', async (req, res) => {
  const { sourceId, tier, verificationToken, promoCode } = req.body || {};

  const base = PRICES[tier];
  if (!base)     return res.status(400).json({ error: 'Invalid tier' });
  if (!sourceId) return res.status(400).json({ error: 'Missing sourceId' });

  let amount = base;
  if (promoCode) {
    const disc = PROMOS[String(promoCode).toUpperCase()];
    if (disc) amount = BigInt(Math.round(Number(base) * (1 - disc)));
  }

  try {
    const { result } = await sq.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amountMoney: { amount, currency: 'USD' },
      locationId: process.env.SQUARE_LOCATION_ID || '',
      ...(verificationToken ? { verificationToken } : {}),
    });
    res.json({ success: true, paymentId: result.payment.id });
  } catch (err) {
    const msg = (err?.errors || [])[0]?.detail || err.message || 'Payment failed';
    res.status(402).json({ error: msg });
  }
});

app.listen(PORT, () => console.log(`latinagod.xyz running on port ${PORT}`));
