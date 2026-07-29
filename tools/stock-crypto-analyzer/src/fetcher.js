/**
 * Data Fetcher Module
 * Fetches real-time candle history for VN Stocks (via Entrade API) and Crypto assets (via Binance API).
 */

const https = require('https');

/**
 * Helper to execute simple HTTPS GET request
 * @param {string} url
 * @returns {Promise<string>}
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP status ${res.statusCode} for ${url}`));
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', err => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Fetches Crypto candles from Binance Public API
 * @param {string} symbol - e.g., 'BTCUSDT', 'ETHUSDT'
 * @param {string} interval - e.g., '1d'
 * @param {number} limit - Number of candles (default 100)
 * @returns {Promise<Array<{date: string, open: number, high: number, low: number, close: number, volume: number}>>}
 */
async function fetchCryptoCandles(symbol, interval = '1d', limit = 100) {
  const formattedSymbol = symbol.toUpperCase().replace('-', '').replace('_', '');
  const url = `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`;

  const jsonStr = await fetchUrl(url);
  const rawData = JSON.parse(jsonStr);

  return rawData.map(item => ({
    date: new Date(item[0]).toISOString().split('T')[0],
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5])
  }));
}

/**
 * Fetches Vietnam Stock candles from Entrade API (High reliability & real-time)
 * @param {string} symbol - e.g., 'SSI', 'MSN', 'HPG', 'FPT', 'VND'
 * @returns {Promise<Array<{date: string, open: number, high: number, low: number, close: number, volume: number}>>}
 */
async function fetchVNStockCandles(symbol) {
  const ticker = symbol.toUpperCase().replace('.VN', '').replace('HOSE:', '').replace('HNX:', '');
  const toSec = Math.floor(Date.now() / 1000);
  const fromSec = toSec - 180 * 86400; // 180 days lookback

  const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?resolution=1D&symbol=${ticker}&from=${fromSec}&to=${toSec}`;
  const jsonStr = await fetchUrl(url);
  const json = JSON.parse(jsonStr);

  if (!json || !json.t || !Array.isArray(json.t) || json.t.length === 0) {
    throw new Error(`No candle data returned for ticker ${ticker}`);
  }

  const candles = [];
  for (let i = 0; i < json.t.length; i++) {
    if (json.c[i] !== null && json.c[i] !== undefined) {
      const multiplier = json.c[i] < 1000 ? 1000 : 1;
      candles.push({
        date: new Date(json.t[i] * 1000).toISOString().split('T')[0],
        open: json.o[i] * multiplier,
        high: json.h[i] * multiplier,
        low: json.l[i] * multiplier,
        close: json.c[i] * multiplier,
        volume: json.v[i]
      });
    }
  }

  return candles;
}

/**
 * Generates realistic Mock candle data for offline testing or fallback
 * @param {string} symbol
 * @param {number} count
 * @returns {Array<{date: string, open: number, high: number, low: number, close: number, volume: number}>}
 */
function generateMockCandles(symbol, count = 100) {
  const isCrypto = symbol.toUpperCase().includes('USDT') || symbol.toUpperCase().includes('BTC') || symbol.toUpperCase().includes('ETH');
  const cleanSym = symbol.toUpperCase().replace('.VN', '');

  let basePrice = 25000;
  if (isCrypto) {
    basePrice = cleanSym.startsWith('BTC') ? 65000 : 3400;
  } else if (cleanSym === 'SSI') {
    basePrice = 23250;
  } else if (cleanSym === 'MSN') {
    basePrice = 66300;
  } else if (cleanSym === 'VND') {
    basePrice = 16400;
  } else if (cleanSym === 'HPG') {
    basePrice = 21650;
  } else if (cleanSym === 'FPT') {
    basePrice = 65100;
  }

  let baseVol = isCrypto ? 50000 : 12000000;
  const candles = [];
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const changeRatio = (Math.random() - 0.48) * 0.025;
    const close = basePrice * (1 + changeRatio);
    const high = Math.max(basePrice, close) * (1 + Math.random() * 0.012);
    const low = Math.min(basePrice, close) * (1 - Math.random() * 0.012);
    const volume = baseVol * (0.8 + Math.random() * 0.8);

    candles.push({
      date: dateStr,
      open: basePrice,
      high,
      low,
      close,
      volume
    });
    basePrice = close;
  }

  return candles;
}

/**
 * Smart fetcher that attempts live APIs (Entrade for VN stocks, Binance for Crypto)
 * @param {string} symbol
 * @returns {Promise<{candles: Array, isMock: boolean}>}
 */
async function fetchCandles(symbol) {
  const symUpper = symbol.toUpperCase();

  // 1. Crypto via Binance API
  if (symUpper.endsWith('USDT') || symUpper.endsWith('BUSD')) {
    try {
      const candles = await fetchCryptoCandles(symUpper);
      if (candles && candles.length >= 20) return { candles, isMock: false };
    } catch (e) {
      // Fallback
    }
  }

  // 2. VN Stock via Entrade API
  try {
    const candles = await fetchVNStockCandles(symUpper);
    if (candles && candles.length >= 20) {
      return { candles, isMock: false };
    }
  } catch (e) {
    // Fallback
  }

  // 3. Fallback to mock data
  return { candles: generateMockCandles(symUpper), isMock: true };
}

module.exports = {
  fetchCryptoCandles,
  fetchVNStockCandles,
  generateMockCandles,
  fetchCandles
};
