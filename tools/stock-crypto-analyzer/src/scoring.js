/**
 * Trend Scoring Engine
 * Computes 0-100 Trend Scores for Short-Term (T+), Medium-Term, and Long-Term investment horizons.
 */

/**
 * Calculates Short-Term Trend Score (T+ / 1-14 days)
 * @param {Object} ind - Indicators computed by computeAllIndicators
 * @returns {number} Score from 0 to 100
 */
function computeShortTermScore(ind) {
  let score = 50; // Base score

  // EMA10 vs EMA20
  if (ind.ema10 !== null && ind.ema20 !== null) {
    if (ind.currentPrice > ind.ema10 && ind.ema10 > ind.ema20) score += 15;
    else if (ind.currentPrice > ind.ema10) score += 10;
    else if (ind.currentPrice < ind.ema20) score -= 15;
  }

  // RSI
  if (ind.rsi !== null) {
    if (ind.rsi >= 50 && ind.rsi <= 65) score += 15; // Healthy momentum
    else if (ind.rsi > 65 && ind.rsi <= 75) score += 10; // Strong but watch out
    else if (ind.rsi > 75) score -= 5; // Overbought risk
    else if (ind.rsi >= 40 && ind.rsi < 50) score += 0;
    else if (ind.rsi < 30) score -= 15; // Oversold / Weak
  }

  // Volume Spike
  if (ind.volRatio >= 1.5 && ind.priceChangePercent > 0) score += 15;
  else if (ind.volRatio >= 1.2 && ind.priceChangePercent > 0) score += 10;
  else if (ind.volRatio >= 1.5 && ind.priceChangePercent < 0) score -= 15; // Distribution

  // Price Action Change
  if (ind.priceChangePercent > 2) score += 5;
  else if (ind.priceChangePercent < -2) score -= 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculates Medium-Term Trend Score (1-3 months)
 * @param {Object} ind - Indicators computed by computeAllIndicators
 * @returns {number} Score from 0 to 100
 */
function computeMediumTermScore(ind) {
  let score = 50;

  // Price vs MA50
  if (ind.ma50 !== null) {
    if (ind.currentPrice > ind.ma50) score += 20;
    else score -= 20;
  }

  // MACD Line vs Signal Line
  if (ind.macd && ind.macd.macdLine !== null && ind.macd.signalLine !== null) {
    if (ind.macd.macdLine > ind.macd.signalLine) score += 15;
    else score -= 15;

    if (ind.macd.macdLine > 0) score += 10;
  }

  // Volume Confirmation
  if (ind.volRatio > 1.1) score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculates Long-Term Trend Score (6-12+ months)
 * @param {Object} ind - Indicators computed by computeAllIndicators
 * @returns {number} Score from 0 to 100
 */
function computeLongTermScore(ind) {
  let score = 50;

  // Price vs MA200
  if (ind.ma200 !== null) {
    if (ind.currentPrice > ind.ma200) score += 25;
    else score -= 25;
  } else if (ind.ma50 !== null) {
    // Fallback if MA200 not available yet
    if (ind.currentPrice > ind.ma50) score += 15;
  }

  // Distance from 52-week High / Low
  if (ind.levels && ind.levels.resistance > 0) {
    const distToHigh = (ind.levels.resistance - ind.currentPrice) / ind.levels.resistance;
    if (distToHigh < 0.1) score += 15; // Near highs (bullish structure)
    else if (distToHigh > 0.4) score -= 10; // Deep drawdown
  }

  // RSI long-term health
  if (ind.rsi !== null && ind.rsi >= 45 && ind.rsi <= 65) score += 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Maps numeric score to human readable trend status and action text
 * @param {number} score - Trend score 0-100
 * @returns {{ status: string, emoji: string, action: string }}
 */
function getTrendStatus(score) {
  if (score >= 75) {
    return {
      status: 'UPTREND MẠNH',
      emoji: '🟢',
      action: 'Ưu tiên MUA / Tiếp tục NẮM GIỮ (Tăng tỷ trọng khi chỉnh nhẹ)'
    };
  } else if (score >= 50) {
    return {
      status: 'SIDEWAYS TĂNG',
      emoji: '🟡',
      action: 'NẮM GIỮ, Mua thăm dò tại vùng hỗ trợ'
    };
  } else if (score >= 35) {
    return {
      status: 'SIDEWAYS GIẢM / SUY YẾU',
      emoji: '🟠',
      action: 'HẠ TỶ TRỌNG, Tạm dừng mua mới, Quản trị rủi ro'
    };
  } else {
    return {
      status: 'DOWNTREND MẠNH',
      emoji: '🔴',
      action: 'BÁN CẮT LỖ / Bán đứng ngoài thị trường'
    };
  }
}

/**
 * Computes complete scoring evaluation for all 3 horizons
 * @param {Object} ind - Indicators
 * @returns {Object} Evaluation object for Short, Medium, Long term
 */
function evaluateSymbolTrend(ind) {
  const shortScore = computeShortTermScore(ind);
  const medScore = computeMediumTermScore(ind);
  const longScore = computeLongTermScore(ind);

  return {
    shortTerm: {
      score: shortScore,
      ...getTrendStatus(shortScore)
    },
    mediumTerm: {
      score: medScore,
      ...getTrendStatus(medScore)
    },
    longTerm: {
      score: longScore,
      ...getTrendStatus(longScore)
    }
  };
}

module.exports = {
  computeShortTermScore,
  computeMediumTermScore,
  computeLongTermScore,
  getTrendStatus,
  evaluateSymbolTrend
};
