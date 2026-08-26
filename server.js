const express = require('express');
const path    = require('path');
const app  = express();
const PORT = process.env.PORT || 3000;

const COINS = [
  { coin: 'BTC',  label: 'Bitcoin',       addr: process.env.CRYPTO_BTC        || '' },
  { coin: 'ETH',  label: 'Ethereum',      addr: process.env.CRYPTO_ETH        || '' },
  { coin: 'USDT', label: 'USDT (TRC-20)', addr: process.env.CRYPTO_USDT_TRC20 || '' },
  { coin: 'LTC',  label: 'Litecoin',      addr: process.env.CRYPTO_LTC        || '' },
  { coin: 'SOL',  label: 'Solana',        addr: process.env.CRYPTO_SOL        || '' },
].filter(c => c.addr.length > 0);

app.get('/api/crypto', (_req, res) => { res.json(COINS); });
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.listen(PORT, () => console.log(`latinagod.xyz running on port ${PORT}`));
