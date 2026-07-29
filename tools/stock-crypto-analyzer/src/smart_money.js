/**
 * Smart Money Tracker Module (Wyckoff / VPA Analysis)
 * Analyzes Price Action and Volume dynamics to detect Accumulation (Gom hàng) vs Distribution (Xả hàng).
 */

/**
 * Detects Volume Dry Up (VDU - Cạn cung tích lũy)
 * @param {Array<{close: number, volume: number}>} candles
 * @param {Object} ind - Indicators summary
 * @returns {{ isVDU: boolean, score: number, reason: string }}
 */
function detectVolumeDryUp(candles, ind) {
  if (!ind || ind.volRatio === undefined) {
    return { isVDU: false, score: 0, reason: '' };
  }

  if (ind.volRatio <= 0.65 && Math.abs(ind.priceChangePercent) < 1.5) {
    return {
      isVDU: true,
      score: 30,
      reason: `Khối lượng cạn kiệt (Volume = ${ind.volRatio.toFixed(2)}x MA20) tại vùng tích lũy -> Cung cạn, Cá mập gom xong chuẩn bị đánh lên.`
    };
  }

  return { isVDU: false, score: 0, reason: '' };
}

/**
 * Detects Liquidity Sweep / Shakeout (Rút chân rũ bỏ nhỏ lẻ)
 * @param {Array<{open: number, high: number, low: number, close: number, volume: number}>} candles
 * @param {Object} ind
 * @returns {{ isShakeout: boolean, score: number, reason: string }}
 */
function detectShakeout(candles, ind) {
  if (!candles || candles.length < 2) {
    return { isShakeout: false, score: 0, reason: '' };
  }

  const last = candles[candles.length - 1];
  const candleRange = last.high - last.low;
  if (candleRange === 0) return { isShakeout: false, score: 0, reason: '' };

  const lowerShadow = Math.min(last.open, last.close) - last.low;
  const shadowRatio = lowerShadow / candleRange;

  if (shadowRatio >= 0.55 && ind.volRatio >= 1.1) {
    return {
      isShakeout: true,
      score: 35,
      reason: `Nến Spring/Shakeout rút chân mạnh (Bóng dưới ${(shadowRatio * 100).toFixed(0)}%, Vol ${ind.volRatio.toFixed(2)}x) -> Cá mập vừa ép rũ bỏ nhỏ lẻ cắt lỗ.`
    };
  }

  return { isShakeout: false, score: 0, reason: '' };
}

/**
 * Detects Upthrust / Churning (Kéo xả volume khủng)
 * @param {Array<{open: number, high: number, low: number, close: number, volume: number}>} candles
 * @param {Object} ind
 * @returns {{ isDistribution: boolean, score: number, reason: string }}
 */
function detectDistribution(candles, ind) {
  if (!candles || candles.length < 2) {
    return { isDistribution: false, score: 0, reason: '' };
  }

  const last = candles[candles.length - 1];
  const candleRange = last.high - last.low;
  if (candleRange === 0) return { isDistribution: false, score: 0, reason: '' };

  const upperShadow = last.high - Math.max(last.open, last.close);
  const upperRatio = upperShadow / candleRange;

  // Case 1: High volume but price barely moved or closed near low (Churning)
  if (ind.volRatio >= 1.5 && (Math.abs(ind.priceChangePercent) < 0.6 || upperRatio > 0.5)) {
    return {
      isDistribution: true,
      score: -40,
      reason: `Tín hiệu Upthrust/Churning: Volume đột biến (${ind.volRatio.toFixed(2)}x MA20) nhưng giá không tăng hoặc dội nến -> Cá mập âm thầm xả hàng!`
    };
  }

  return { isDistribution: false, score: 0, reason: '' };
}

/**
 * Detects Bulltrap / False Breakout
 * @param {Array} candles
 * @param {Object} ind
 * @returns {{ isBulltrap: boolean, score: number, reason: string }}
 */
function detectBulltrap(candles, ind) {
  if (!candles || candles.length < 10) {
    return { isBulltrap: false, score: 0, reason: '' };
  }

  const last = candles[candles.length - 1];
  const prevSlice = candles.slice(-20, -1);
  const maxPrevHigh = Math.max(...prevSlice.map(c => c.high));

  // High reached new local high but close price fell back inside range with high volume
  if (last.high > maxPrevHigh && last.close < maxPrevHigh && ind.volRatio > 1.2) {
    return {
      isBulltrap: true,
      score: -35,
      reason: `Bẫy vượt đỉnh giả (Bulltrap): Giá chạm đỉnh ngắn hạn nhưng bị kéo xả tụt lùi với Volume cao.`
    };
  }

  return { isBulltrap: false, score: 0, reason: '' };
}

/**
 * Comprehensive Smart Money Evaluation
 * @param {Array} candles
 * @param {Object} ind
 * @returns {{ score: number, status: string, emoji: string, details: string[] }}
 */
function evaluateSmartMoney(candles, ind) {
  const vdu = detectVolumeDryUp(candles, ind);
  const shakeout = detectShakeout(candles, ind);
  const dist = detectDistribution(candles, ind);
  const bulltrap = detectBulltrap(candles, ind);

  let totalScore = 0;
  const details = [];

  if (vdu.isVDU) {
    totalScore += vdu.score;
    details.push(vdu.reason);
  }
  if (shakeout.isShakeout) {
    totalScore += shakeout.score;
    details.push(shakeout.reason);
  }
  if (dist.isDistribution) {
    totalScore += dist.score;
    details.push(dist.reason);
  }
  if (bulltrap.isBulltrap) {
    totalScore += bulltrap.score;
    details.push(bulltrap.reason);
  }

  // Trend alignment bonus
  if (ind.priceChangePercent > 1.5 && ind.volRatio >= 1.3 && !dist.isDistribution) {
    totalScore += 20;
    details.push(`Dòng tiền chủ động mua bứt phá (Vol ${ind.volRatio.toFixed(2)}x MA20, Giá +${ind.priceChangePercent.toFixed(2)}%).`);
  }

  let status = 'TRUNG LẬP / THEO DÕI CUNG CẦU';
  let emoji = '🟡';

  if (totalScore >= 25) {
    status = 'CÁ MẬP DẰN NỀN GOM HÀNG (ACCUMULATION)';
    emoji = '🟢 🐋';
  } else if (totalScore <= -25) {
    status = 'CẢNH BÁO CÁ MẬP XẢ HÀNG (DISTRIBUTION)';
    emoji = '🔴 🐋';
  }

  if (details.length === 0) {
    details.push('Dòng tiền cá mập đang ở trạng thái tích lũy cân bằng, chưa có đột biến VPA.');
  }

  return {
    score: totalScore,
    status,
    emoji,
    details
  };
}

module.exports = {
  detectVolumeDryUp,
  detectShakeout,
  detectDistribution,
  detectBulltrap,
  evaluateSmartMoney
};
