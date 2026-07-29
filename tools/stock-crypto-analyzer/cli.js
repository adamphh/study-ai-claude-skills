/**
 * Main CLI Entry Point
 * Usage: node cli.js --symbols HPG.VN,FPT.VN,SSI.VN,MSN.VN,BTCUSDT,ETHUSDT
 */

const { fetchCandles } = require('./src/fetcher');
const { computeAllIndicators } = require('./src/indicators');
const { evaluateSymbolTrend } = require('./src/scoring');
const { evaluateSmartMoney } = require('./src/smart_money');
const { displayTerminalReport, saveMarkdownReport } = require('./src/reporter');

async function main() {
  const args = process.argv.slice(2);
  let symbolsArg = 'HPG.VN,FPT.VN,SSI.VN,MSN.VN,BTCUSDT,ETHUSDT'; // Default watch list

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--symbols' && args[i + 1]) {
      symbolsArg = args[i + 1];
    }
  }

  const symbols = symbolsArg.split(',').map(s => s.trim()).filter(Boolean);
  console.log(`\n🔍 Đang phân tích ${symbols.length} mã: ${symbols.join(', ')}...`);

  const results = [];

  for (const sym of symbols) {
    try {
      const { candles, isMock } = await fetchCandles(sym);
      const indicators = computeAllIndicators(candles);
      const scoring = evaluateSymbolTrend(indicators);
      const smartMoney = evaluateSmartMoney(candles, indicators);

      results.push({ symbol: sym, indicators, scoring, smartMoney, isMock });
    } catch (err) {
      console.error(`❌ Lỗi khi phân tích mã ${sym}:`, err.message);
    }
  }

  if (results.length > 0) {
    displayTerminalReport(results);
    const reportPath = saveMarkdownReport(results);
    console.log(`\n✅ Đã xuất báo cáo Markdown tại: ${reportPath}\n`);
  } else {
    console.error('⚠️ Không thể phân tích mã nào trong danh sách.');
  }
}

if (require.main === module) {
  main();
}
