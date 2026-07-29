# Kế Hoạch Triển Khai: Bộ Chỉ Số & Tool Phân Tích Xu Hướng Cổ Phiếu / Crypto Hàng Ngày

## 📌 1. Mục Tiêu Task
- Mở rộng Kỹ năng (`my-skills/stock-analysis/SKILL.md`) hỗ trợ 3 khung thời gian đầu tư (Ngắn hạn T+, Trung hạn 1-3 tháng, Dài hạn giá trị) và 2 thị trường (Chứng khoán Việt Nam HOSE/HNX + Crypto Quốc tế).
- Xây dựng Công cụ Tự động hóa Phân tích Hàng ngày (`tools/stock-crypto-analyzer`) bằng **Node.js** (do máy tính đã có sẵn Node.js v18 mà không cần cài thêm Python).
- Viết và chạy bộ kiểm thử tự động (Automation Unit Test) cho công cụ, báo cáo kết quả chi tiết trong `walkthrough.md`.

---

## 🏗️ 2. Các Hạng Mục Triển Khai

### Hạng mục 1: Nâng cấp SKILL.md trong `my-skills/stock-analysis/`
- Thêm cấu trúc phân tích 3 trường phái:
  1. **Ngắn hạn (T+ / 1-14 ngày):** Ưu tiên EMA10/20, RSI, Volume spike, Price Action breakout/pinbar.
  2. **Trung hạn (1-3 tháng):** Ưu tiên MA50, MACD, Sóng ngành, CMF dòng tiền, ADX.
  3. **Dài hạn (6-12+ tháng):** Ưu tiên MA200, Vùng giá tích lũy 52 tuần, Xu hướng vĩ mô/nền tảng.
- Thêm quy chuẩn riêng cho Crypto (Biến động 24/7, BTC Dominance, Funding Rate / Liquidation risk) và Chứng khoán VN (Khối ngoại, Tự doanh, VN-Index, T+2.5).

### Hạng mục 2: Xây dựng Tool Tự động hóa Node.js (`tools/stock-crypto-analyzer`)
- `src/fetcher.js`: Cào/lấy dữ liệu giá & volume hàng ngày từ Yahoo Finance API (cho CK Việt Nam dạng `HPG.VN`, `FPT.VN`...) và Binance/Yahoo API (cho Crypto `BTCUSDT`, `ETHUSDT`...).
- `src/indicators.js`: Thuật toán tính toán chỉ báo kỹ thuật (EMA10, EMA20, MA50, MA200, RSI, MACD, Volume vs MA20 Vol, Support/Resistance).
- `src/scoring.js`: Động cơ chấm điểm Xu hướng (Trend Score 0-100) riêng cho Ngắn hạn, Trung hạn, Dài hạn.
- `src/reporter.js`: Xuất báo cáo console màu sắc & tự động tạo file Markdown báo cáo hàng ngày (`reports/daily_report_YYYY-MM-DD.md`).
- `cli.js`: Đánh lệnh CLI đơn giản (Ví dụ: `node cli.js --symbols HPG.VN,FPT.VN,BTCUSDT`).

### Hạng mục 3: Bộ Kiểm Thử Tự Động (Automated Testing)
- `tests/indicators.test.js`: Kiểm thử độ chính xác tính toán chỉ số EMA, RSI, MACD.
- `tests/scoring.test.js`: Kiểm thử logic chấm điểm Trend Score cho 3 trường phái.
- Chạy test thực tế qua terminal, chụp log pass/fail đính kèm vào `walkthrough.md`.

---

## ⏱️ 3. Quy Trình Phê Duyệt & Thực Thi
1. Người dùng duyệt kế hoạch này và `implementation_plan.md` artifact.
2. Thực thi viết code & nâng cấp skill.
3. Chạy test tự động & chạy công cụ thực tế với các mã mẫu (ví dụ: HPG, FPT, BTC, ETH).
4. Tổng kết và bàn giao hướng dẫn chạy hàng ngày cho người dùng.
