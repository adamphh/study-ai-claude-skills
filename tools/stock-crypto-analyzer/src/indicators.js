/**
 * Technical Indicators Calculator Module
 * Provides pure functions to compute SMA, EMA, RSI, MACD, Volume Ratio, and Price Action levels.
 */

/**
 * Calculates Simple Moving Average (SMA)
 * @param {number[]} data - Array of numbers (prices or volume)
 * @param {number} period - Calculation period
 * @returns {number[]} Array of SMA values (same length, null for initial insufficient bars)
 */
function calculateSMA(data, period) {
  const result = new Array(data.length).fill(null);
  if (!data || data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result[i] = sum / period;
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 * @param {number[]} data - Array of prices
 * @param {number} period - Calculation period
 * @returns {number[]} Array of EMA values
 */
function calculateEMA(data, period) {
  const result = new Array(data.length).fill(null);
  if (!data || data.length < period) return result;

  // First EMA value is simple average
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  const multiplier = 2 / (period + 1);
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI)
 * @param {number[]} data - Array of closing prices
 * @param {number} period - RSI period (default 14)
 * @returns {number[]} Array of RSI values
 */
function calculateRSI(data, period = 14) {
  const result = new Array(data.length).fill(null);
  if (!data || data.length <= period) return result;

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change >= 0) gainSum += change;
    else lossSum += Math.abs(change);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - (100 / (1 + rs));
  }

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - (100 / (1 + rs));
    }
  }

  return result;
}

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 * @param {number[]} data - Array of closing prices
 * @param {number} fastPeriod - Fast EMA period (default 12)
 * @param {number} slowPeriod - Slow EMA period (default 26)
 * @param {number} signalPeriod - Signal line EMA period (default 9)
 * @returns {{ macdLine: number[], signalLine: number[], histogram: number[] }}
 */
function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  const macdLine = new Array(data.length).fill(null);
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine[i] = fastEMA[i] - slowEMA[i];
    }
  }

  // Filter valid macdLine values for Signal calculation
  const validMacdStartIndex = macdLine.findIndex(val => val !== null);
  let signalLine = new Array(data.length).fill(null);

  if (validMacdStartIndex !== -1) {
    const validMacdValues = macdLine.slice(validMacdStartIndex);
    const signalSub = calculateEMA(validMacdValues, signalPeriod);
    for (let i = 0; i < signalSub.length; i++) {
      signalLine[validMacdStartIndex + i] = signalSub[i];
    }
  }

  const histogram = new Array(data.length).fill(null);
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogram[i] = macdLine[i] - signalLine[i];
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Support and Resistance levels from candle history
 * @param {Array<{high: number, low: number, close: number}>} candles
 * @param {number} lookback - Number of historical candles to analyze (default 30)
 * @returns {{ support: number, resistance: number, pivot: number }}
 */
function calculateSupportResistance(candles, lookback = 30) {
  if (!candles || candles.length === 0) {
    return { support: 0, resistance: 0, pivot: 0 };
  }
  const slice = candles.slice(-lookback);
  let maxHigh = -Infinity;
  let minLow = Infinity;

  slice.forEach(c => {
    if (c.high > maxHigh) maxHigh = c.high;
    if (c.low < minLow) minLow = c.low;
  });

  const lastCandle = slice[slice.length - 1];
  const pivot = (lastCandle.high + lastCandle.low + lastCandle.close) / 3;

  return {
    support: minLow,
    resistance: maxHigh,
    pivot
  };
}

/**
 * Computes all technical metrics for a candle history dataset
 * @param {Array<{date: string, open: number, high: number, low: number, close: number, volume: number}>} candles
 * @returns {Object} Comprehensive summary of current indicators
 */
function computeAllIndicators(candles) {
  if (!candles || candles.length < 20) {
    throw new Error('Insufficient candles data for indicator calculation (minimum 20 needed)');
  }

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const lastIndex = candles.length - 1;
  const currentPrice = closes[lastIndex];

  // Moving Averages
  const ema10 = calculateEMA(closes, 10);
  const ema20 = calculateEMA(closes, 20);
  const ma50 = calculateSMA(closes, Math.min(50, closes.length));
  const ma200 = calculateSMA(closes, Math.min(200, closes.length));

  // Volume MA
  const volMA20 = calculateSMA(volumes, 20);
  const currentVol = volumes[lastIndex];
  const volRatio = volMA20[lastIndex] ? currentVol / volMA20[lastIndex] : 1;

  // RSI & MACD
  const rsiArray = calculateRSI(closes, 14);
  const macdResult = calculateMACD(closes, 12, 26, 9);

  // Price Action / Support / Resistance
  const levels = calculateSupportResistance(candles, Math.min(30, candles.length));

  // Daily change percentage
  const prevPrice = closes[lastIndex - 1] || currentPrice;
  const priceChangePercent = ((currentPrice - prevPrice) / prevPrice) * 100;

  return {
    currentPrice,
    priceChangePercent,
    currentVolume: currentVol,
    volRatio,
    ema10: ema10[lastIndex],
    ema20: ema20[lastIndex],
    ma50: ma50[lastIndex],
    ma200: ma200[lastIndex],
    rsi: rsiArray[lastIndex],
    macd: {
      macdLine: macdResult.macdLine[lastIndex],
      signalLine: macdResult.signalLine[lastIndex],
      histogram: macdResult.histogram[lastIndex]
    },
    levels
  };
}

module.exports = {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateSupportResistance,
  computeAllIndicators
};
