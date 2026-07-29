/**
 * Unit Tests for Smart Money Tracker (Wyckoff / VPA Engine)
 */

const assert = require('assert');
const {
  detectVolumeDryUp,
  detectShakeout,
  detectDistribution,
  detectBulltrap,
  evaluateSmartMoney
} = require('../src/smart_money');

function testVDU() {
  const ind = { volRatio: 0.5, priceChangePercent: 0.2 };
  const vdu = detectVolumeDryUp([], ind);
  assert.strictEqual(vdu.isVDU, true);
  assert(vdu.score > 0);
  console.log('✓ testVDU passed');
}

function testShakeout() {
  const candles = [
    { open: 100, high: 101, low: 98, close: 100 },
    { open: 100, high: 102, low: 90, close: 101 } // Lower shadow = 101 - 90 = 11, Total range = 12 (ratio 11/12 = 91%)
  ];
  const ind = { volRatio: 1.5 };
  const shakeout = detectShakeout(candles, ind);
  assert.strictEqual(shakeout.isShakeout, true);
  assert(shakeout.score > 0);
  console.log('✓ testShakeout passed');
}

function testDistribution() {
  const candles = [
    { open: 100, high: 101, low: 98, close: 100 },
    { open: 100, high: 110, low: 99, close: 101 } // Upper shadow = 110 - 101 = 9, Total range = 11 (ratio 9/11 = 81%)
  ];
  const ind = { volRatio: 1.8, priceChangePercent: 0.2 };
  const dist = detectDistribution(candles, ind);
  assert.strictEqual(dist.isDistribution, true);
  assert(dist.score < 0);
  console.log('✓ testDistribution passed');
}

function testSmartMoneyEvaluation() {
  const candles = [
    { open: 100, high: 101, low: 98, close: 100 },
    { open: 100, high: 102, low: 90, close: 101 }
  ];
  const ind = { volRatio: 0.5, priceChangePercent: 0.2 };
  const sm = evaluateSmartMoney(candles, ind);
  assert(sm.score >= 25);
  assert(sm.status.includes('ACCUMULATION'));
  console.log('✓ testSmartMoneyEvaluation passed');
}

function runAll() {
  console.log('=== RUNNING SMART MONEY TESTS ===');
  testVDU();
  testShakeout();
  testDistribution();
  testSmartMoneyEvaluation();
  console.log('ALL SMART MONEY TESTS PASSED!\n');
}

runAll();
