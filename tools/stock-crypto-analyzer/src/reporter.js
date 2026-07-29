/**
 * Reporter Module
 * Formats analysis results for terminal display and generates daily Markdown report files,
 * including Smart Money (Wyckoff / VPA) tracking.
 */

const fs = require('fs');
const path = require('path');

function formatPrice(num) {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return num.toFixed(4);
}

/**
 * Displays summary in terminal
 * @param {Array<{symbol: string, indicators: Object, scoring: Object, smartMoney: Object, isMock: boolean}>} results
 */
function displayTerminalReport(results) {
  console.log('\n========================================================================');
  console.log('📈 BÁO CÁO PHÂN TÍCH XU HƯỚNG & DẤU CHÂN CÁ MẬP HÀNG NGÀY');
  console.log(`📅 Ngày thực hiện: ${new Date().toISOString().split('T')[0]}`);
  console.log('========================================================================\n');

  results.forEach(res => {
    const { symbol, indicators: ind, scoring, smartMoney: sm, isMock } = res;
    const changeSymbol = ind.priceChangePercent >= 0 ? '+' : '';
    const mockBadge = isMock ? ' [MOCK DATA]' : '';

    console.log(`------------------------------------------------------------------------`);
    console.log(`🔍 MÃ SẢN PHẨM: ${symbol.toUpperCase()}${mockBadge}`);
    console.log(`   Giá hiện tại : ${formatPrice(ind.currentPrice)} (${changeSymbol}${ind.priceChangePercent.toFixed(2)}%)`);
    console.log(`   Volume vs MA20: ${ind.volRatio.toFixed(2)}x`);
    console.log(`   RSI (14)      : ${ind.rsi ? ind.rsi.toFixed(1) : 'N/A'}`);
    console.log(`   MACD Line     : ${ind.macd.macdLine ? ind.macd.macdLine.toFixed(2) : 'N/A'}`);
    console.log(`   Hỗ trợ / Kháng cự : ${formatPrice(ind.levels.support)}  <--->  ${formatPrice(ind.levels.resistance)}`);
    console.log(`   --- 🐋 SMART MONEY TRACKER (CÁ MẬP) ---`);
    console.log(`   Trạng thái    : ${sm.emoji} ${sm.status}`);
    sm.details.forEach(d => console.log(`   -> Chi tiết  : ${d}`));
    console.log(`   --- 🎯 ĐÁNH GIÁ 3 TRƯỜNG PHÁI ---`);
    console.log(`   ⚡ Ngắn hạn (T+)  : Score ${scoring.shortTerm.score}/100 | ${scoring.shortTerm.emoji} ${scoring.shortTerm.status}`);
    console.log(`      -> Hành động   : ${scoring.shortTerm.action}`);
    console.log(`   🌊 Trung hạn      : Score ${scoring.mediumTerm.score}/100 | ${scoring.mediumTerm.emoji} ${scoring.mediumTerm.status}`);
    console.log(`      -> Hành động   : ${scoring.mediumTerm.action}`);
    console.log(`   💎 Dài hạn        : Score ${scoring.longTerm.score}/100 | ${scoring.longTerm.emoji} ${scoring.longTerm.status}`);
    console.log(`      -> Hành động   : ${scoring.longTerm.action}`);
    console.log(``);
  });
}

/**
 * Saves a daily Markdown report file
 * @param {Array<{symbol: string, indicators: Object, scoring: Object, smartMoney: Object, isMock: boolean}>} results
 * @returns {string} Saved file absolute path
 */
function saveMarkdownReport(results) {
  const dateStr = new Date().toISOString().split('T')[0];
  const reportsDir = path.join(__dirname, '..', 'reports');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filePath = path.join(reportsDir, `daily_report_${dateStr}.md`);

  let md = `# 📊 BÁO CÁO PHÂN TÍCH XU HƯỚNG & DẤU CHÂN CÁ MẬP HÀNG NGÀY\n\n`;
  md += `**Ngày xuất báo cáo:** \`${dateStr}\`  \n`;
  md += `**Số lượng mã theo dõi:** ${results.length}  \n\n`;
  md += `---\n\n`;

  results.forEach(res => {
    const { symbol, indicators: ind, scoring, smartMoney: sm, isMock } = res;
    const changeSymbol = ind.priceChangePercent >= 0 ? '+' : '';
    const mockNote = isMock ? ' *(Dữ liệu mô phỏng)*' : '';

    md += `## 📌 Mã: \`${symbol.toUpperCase()}\`${mockNote}\n\n`;
    md += `- **Giá đóng cửa:** \`${formatPrice(ind.currentPrice)}\` (${changeSymbol}${ind.priceChangePercent.toFixed(2)}%)\n`;
    md += `- **Thanh khoản:** Volume Ratio = \`${ind.volRatio.toFixed(2)}x\` vs MA20\n`;
    md += `- **Chỉ báo động lượng:** RSI(14) = \`${ind.rsi ? ind.rsi.toFixed(1) : 'N/A'}\` | MACD = \`${ind.macd.macdLine ? ind.macd.macdLine.toFixed(2) : 'N/A'}\`\n`;
    md += `- **Vùng Hỗ trợ / Kháng cự:** Hỗ trợ: \`${formatPrice(ind.levels.support)}\` | Kháng cự: \`${formatPrice(ind.levels.resistance)}\`\n\n`;

    md += `### 🐋 Smart Money Tracker (Soi Dấu Chân Cá Mập):\n`;
    md += `- **Trạng thái:** ${sm.emoji} **${sm.status}**\n`;
    sm.details.forEach(d => {
      md += `- **VPA Vết tích:** ${d}\n`;
    });
    md += `\n`;

    md += `### 🎯 Bảng Đánh Giá 3 Trường Phái Đầu Tư:\n\n`;
    md += `| Trường phái | Điểm (Trend Score) | Trạng thái | Khuyên dùng hành động |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    md += `| **⚡ Ngắn hạn (T+)** | **${scoring.shortTerm.score} / 100** | ${scoring.shortTerm.emoji} **${scoring.shortTerm.status}** | ${scoring.shortTerm.action} |\n`;
    md += `| **🌊 Trung hạn (1-3M)** | **${scoring.mediumTerm.score} / 100** | ${scoring.mediumTerm.emoji} **${scoring.mediumTerm.status}** | ${scoring.mediumTerm.action} |\n`;
    md += `| **💎 Dài hạn (6-12M)** | **${scoring.longTerm.score} / 100** | ${scoring.longTerm.emoji} **${scoring.longTerm.status}** | ${scoring.longTerm.action} |\n\n`;
    md += `---\n\n`;
  });

  fs.writeFileSync(filePath, md, 'utf-8');
  return filePath;
}

module.exports = {
  displayTerminalReport,
  saveMarkdownReport
};
