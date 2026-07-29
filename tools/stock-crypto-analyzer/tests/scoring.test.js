/**
 * Unit Tests for Trend Scoring Engine
 */

const assert = require('assert');
const {
  computeShortTermScore,
  computeMediumTermScore,
  computeLongTermScore,
  getTrendStatus,
  evaluateSymbolTrend
} = require('../src/scoring');

function testBullishScoring() {
  const bullishIndicators = {
    currentPrice: 100,
    priceChangePercent: 3.5,
    currentVolume: 1500000,
    volRatio: 1.8,
    ema10: 95,
    ema20: 90,
    ma50: 85,
    ma200: 75,
    rsi: 62,
    macd: { macdLine: 3.5, signalLine: 1.2, histogram: 2.3 },
    levels: { support: 80, resistance: 105, pivot: 98 }
  };

  const evalResult = evaluateSymbolTrend(bullishIndicators);

  assert(evalResult.shortTerm.score >= 75, `Short term score should be >= 75 for bullish metrics, got ${evalResult.shortTerm.score}`);
  assert.strictEqual(evalResult.shortTerm.status, 'UPTREND MẠNH');

  assert(evalResult.mediumTerm.score >= 70, `Medium term score should be high, got ${evalResult.mediumTerm.score}`);
  assert(evalResult.longTerm.score >= 75, `Long term score should be high, got ${evalResult.longTerm.score}`);

  console.log('✓ testBullishScoring passed');
}

function testBearishScoring() {
  const bearishIndicators = {
    currentPrice: 50,
    priceChangePercent: -4.0,
    currentVolume: 2000000,
    volRatio: 2.0, // High vol on down day = distribution
    ema10: 55,
    ema20: 60,
    ma50: 70,
    ma200: 85,
    rsi: 25,
    macd: { macdLine: -5.0, signalLine: -2.0, histogram: -3.0 },
    levels: { support: 45, resistance: 90, pivot: 52 }
  };

  const evalResult = evaluateSymbolTrend(bearishIndicators);

  assert(evalResult.shortTerm.score < 35, `Short term score should be < 35 for bearish metrics, got ${evalResult.shortTerm.score}`);
  assert.strictEqual(evalResult.shortTerm.status, 'DOWNTREND MẠNH');

  assert(evalResult.mediumTerm.score < 35, `Medium term score should be low, got ${evalResult.mediumTerm.score}`);
  assert(evalResult.longTerm.score < 35, `Long term score should be low, got ${evalResult.longTerm.score}`);

  console.log('✓ testBearishScoring passed');
}

function testTrendStatusText() {
  const status75 = getTrendStatus(80);
  assert.strictEqual(status75.status, 'UPTREND MẠNH');
  assert.strictEqual(status75.emoji, '🟢');

  const status25 = getTrendStatus(25);
  assert.strictEqual(status25.status, 'DOWNTREND MẠNH');
  assert.strictEqual(status25.emoji, '🔴');

  console.log('✓ testTrendStatusText passed');
}

function runAll() {
  console.log('=== RUNNING SCORING ENGINE TESTS ===');
  testBullishScoring();
  testBearishScoring();
  testTrendStatusText();
  console.log('ALL SCORING TESTS PASSED!\n');
}

runAll();
