/**
 * Unit Tests for Technical Indicators Calculation
 */

const assert = require('assert');
const {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateSupportResistance,
  computeAllIndicators
} = require('../src/indicators');

function testSMA() {
  const data = [10, 20, 30, 40, 50];
  const sma3 = calculateSMA(data, 3);
  assert.strictEqual(sma3[0], null);
  assert.strictEqual(sma3[1], null);
  assert.strictEqual(sma3[2], 20); // (10+20+30)/3 = 20
  assert.strictEqual(sma3[3], 30); // (20+30+40)/3 = 30
  assert.strictEqual(sma3[4], 40); // (30+40+50)/3 = 40
  console.log('✓ testSMA passed');
}

function testEMA() {
  const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const ema5 = calculateEMA(data, 5);
  assert.strictEqual(ema5[0], null);
  assert.strictEqual(ema5[4], 12); // (10+11+12+13+14)/5 = 12
  assert(ema5[9] > 16.5 && ema5[9] < 17.5, 'EMA should follow upward trend');
  console.log('✓ testEMA passed');
}

function testRSI() {
  // Upward trend data should produce RSI > 50
  const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const rsi = calculateRSI(data, 14);
  const lastRSI = rsi[rsi.length - 1];
  assert(lastRSI > 70, `Upward trend RSI should be high (>70), got: ${lastRSI}`);
  console.log('✓ testRSI passed');
}

function testMACD() {
  const data = Array.from({ length: 40 }, (_, i) => 100 + i * 2);
  const macd = calculateMACD(data, 12, 26, 9);
  const lastMacd = macd.macdLine[macd.macdLine.length - 1];
  assert(lastMacd !== null, 'MACD line should not be null after 40 bars');
  assert(lastMacd > 0, 'Strong upward trend should have positive MACD line');
  console.log('✓ testMACD passed');
}

function testSupportResistance() {
  const candles = [
    { high: 105, low: 95, close: 100 },
    { high: 110, low: 90, close: 105 },
    { high: 108, low: 92, close: 102 }
  ];
  const sr = calculateSupportResistance(candles, 3);
  assert.strictEqual(sr.support, 90);
  assert.strictEqual(sr.resistance, 110);
  console.log('✓ testSupportResistance passed');
}

function runAll() {
  console.log('=== RUNNING INDICATORS TESTS ===');
  testSMA();
  testEMA();
  testRSI();
  testMACD();
  testSupportResistance();
  console.log('ALL INDICATORS TESTS PASSED!\n');
}

runAll();
