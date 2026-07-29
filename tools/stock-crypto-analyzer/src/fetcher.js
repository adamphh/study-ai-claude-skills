/**
 * Data Fetcher Module
 * Fetches real-time candle history for VN Stocks (via TCBS API) and Crypto assets (via Binance API).
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
 * Fetches Vietnam Stock candles from TCBS Public API
 * @param {string} symbol - e.g., 'SSI', 'MSN', 'HPG', 'FPT'
 * @returns {Promise<Array<{date: string, open: number, high: number, low: number, close: number, volume: number}>>}
 */
async function fetchVNStockCandles(symbol) {
  const ticker = symbol.toUpperCase().replace('.VN', '').replace('HOSE:', '').replace('HNX:', '');
  const toSec = Math.floor(Date.now() / 1000);
  const fromSec = toSec - 180 * 86400; // 180 days lookback

  const url = `https://apipub.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker=${ticker}&type=stock&resolution=D&from=${fromSec}&to=${toSec}`;
  const jsonStr = await fetchUrl(url);
  const json = JSON.parse(jsonStr);

  if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
    throw new Error(`No data returned from TCBS API for ticker ${ticker}`);
  }

  // Map and sort candles chronologically
  const candles = json.data.map(item => ({
    date: item.tradingDate ? item.tradingDate.split('T')[0] : '',
    open: item.open * 1000,
    high: item.high * 1000,
    low: item.low * 1000,
    close: item.close * 1000,
    volume: item.volume
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

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
  } else if (cleanSym === 'HPG') {
    basePrice = 27500;
  } else if (cleanSym === 'FPT') {
    basePrice = 125000;
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
 * Smart fetcher that attempts live APIs (TCBS for VN stocks, Binance for Crypto)
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

  // 2. VN Stock via TCBS API
  try {
    const candles = await fetchVNStockCandles(symUpper);
    if (candles && candles.length >= 20) {
      return { candles, isMock: false };
    }
  } catch (e) {
    // Fallback
  }

  // 3. Fallback to updated mock data
  return { candles: generateMockCandles(symUpper), isMock: true };
}

module.exports = {
  fetchCryptoCandles,
  fetchVNStockCandles,
  generateMockCandles,
  fetchCandles
};
