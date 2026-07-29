# Kế Hoạch Triển Khai: Nâng Cấp Smart Money Tracker (Soi Dấu Chân Cá Mập)

## 📌 1. Mục Tiêu Task
- Nâng cấp Kỹ năng (`my-skills/stock-analysis/SKILL.md`) bổ sung phương pháp Wyckoff / VPA (Volume Price Analysis) để nhận biết Cá mập Gom hàng vs Xả hàng.
- Xây dựng Module `src/smart_money.js` trong công cụ Node.js `tools/stock-crypto-analyzer` để tự động quét 4 mẫu hình Smart Money cốt lõi:
  1. **Volume Dry Up (VDU):** Cạn cung tích lũy (Cá mập gom hàng sắp đánh lên).
  2. **Shakeout / Spring:** Nến rút chân quét thanh khoản ép nhỏ lẻ cắt lỗ.
  3. **Upthrust / Churning:** Khối lượng kỷ lục nhưng giá không tăng (Xả hàng âm thầm).
  4. **Bulltrap / False Break:** Bẫy tăng giá vượt đỉnh giả để kéo xả.
- Viết bộ kiểm thử tự động `tests/smart_money.test.js`, thực thi test và đính kèm kết quả vào `walkthrough.md`.

---

## 🏗️ 2. Các Hạng Mục Triển Khai

### Hạng mục 1: Cập nhật SKILL.md (`my-skills/stock-analysis/SKILL.md`)
- Thêm Phần 5: **Phân Tích Dấu Chân Cá Mập (Smart Money & Wyckoff Rules)**.
- Đưa ra bộ nhận diện chi tiết bằng hình thái Nến & Volume cho Gom hàng vs Xả hàng.

### Hạng mục 2: Xây dựng Module Node.js (`src/smart_money.js`)
- `detectVolumeDryUp(candles, ind)`: Trả về trạng thái cạn cung.
- `detectShakeout(candles, ind)`: Trả về trạng thái quét thanh khoản rút chân.
- `detectDistribution(candles, ind)`: Trả về trạng thái nến kéo xả volume lớn.
- `evaluateSmartMoney(candles, ind)`: Tổng hợp điểm Smart Money Score (-100 đến +100) và dãn nhãn (`CÁ MẬP GOM HÀNG`, `CÁ MẬP XẢ HÀNG`, `TRUNG LẬP`).

### Hạng mục 3: Tích hợp vào CLI & Báo cáo Markdown (`reporter.js`)
- Hiển thị thêm dòng thông số **🐋 SMART MONEY STATUS** trực tiếp trên màn hình Terminal và Báo cáo Markdown hàng ngày.

### Hạng mục 4: Automation Test & Chạy thực tế
- Viết `tests/smart_money.test.js`.
- Run test và chụp kết quả ghi vào `walkthrough.md`.
