---
name: magento-generate-dev
description: Sinh code Magento 2 (module scaffold, Data Interface/Model/preference tự động từ field bảng, Plugin, Observer/Event, Database schema, REST API, GraphQL resolver, Cron job) và review code, theo convention module Magestore Webpos. Dùng khi được yêu cầu tạo module mới, sinh Api Data Interface và Model từ field bảng, tạo plugin, event/observer, bảng dữ liệu/schema, REST API, GraphQL, cron job, debug lỗi Magento, hoặc review diff code Magento 2.
---

## Tổng quan

Skill này chứa các template và quy trình chuẩn để sinh code cho dự án
Magento 2 + module custom Magestore_Webpos. Mục tiêu: mọi code sinh ra
đều tuân thủ convention của dự án, không cần người dùng phải giải thích
lại quy tắc mỗi lần.

## Convention bắt buộc (áp dụng cho MỌI tác vụ trong skill này)

- Namespace mặc định: `Magestore\Webpos` (hỏi lại nếu module thực tế khác)
- Luôn dùng constructor injection (Dependency Injection), KHÔNG dùng
  `ObjectManager` trực tiếp trong code nghiệp vụ
- Coding standard: PSR-12 + Magento 2 Coding Standard, có docblock đầy đủ
- Không sửa trực tiếp file trong `vendor/`, chỉ sinh/sửa trong `app/code/`
- Database schema: dùng `db_schema.xml` (declarative schema), KHÔNG dùng
  `InstallSchema`/`UpgradeSchema` (đã deprecated theo pattern mới)
- Khi không chắc chắn về tên class, method, hoặc field cụ thể của dự án
  người dùng, hỏi lại thay vì đoán

## Cách chọn hướng dẫn chi tiết

Dựa vào yêu cầu của người dùng, đọc đúng file reference tương ứng trước khi
sinh code:

| Yêu cầu của người dùng | Đọc file |
|---|---|
| Tạo module mới / khung module cơ bản (registration.php, module.xml...) | `references/module-scaffold.md` |
| Sinh Api Data Interface + Model implement + preference di.xml từ field bảng | `references/data-interface-model.md` (dùng script `scripts/generate_data_interface.py`) |
| Tạo Plugin (before/after/around), override behavior của 1 method | `references/plugin.md` |
| Lắng nghe event, tạo Observer | `references/event-observer.md` |
| Tạo bảng mới, thêm cột, declarative schema | `references/db-schema.md` |
| Tạo REST API endpoint | `references/rest-api.md` |
| Tạo GraphQL query/mutation/resolver | `references/graphql.md` |
| Tạo cron job / scheduled task | `references/cron.md` |
| Review diff/code trước khi merge | `references/code-review.md` |
| Debug lỗi, phân tích stack trace | `references/debugging.md` |
| Override class bằng preference/virtualType | `references/preference-virtualtype.md` |

Chỉ đọc (các) file cần thiết cho đúng yêu cầu hiện tại — không cần đọc
toàn bộ thư mục `references/` mỗi lần.

## Quy trình xử lý

1. Xác định loại tác vụ người dùng cần (dùng bảng trên)
2. Đọc file reference tương ứng để lấy đúng cấu trúc/pattern chuẩn
3. Hỏi lại các thông tin còn thiếu quan trọng (tên class, tên bảng, endpoint...)
   nếu người dùng chưa cung cấp — không tự bịa tên class/method không có thật
4. Sinh code đầy đủ theo pattern trong file reference, kèm giải thích ngắn
   gọn lý do lựa chọn kỹ thuật (VD: vì sao chọn `after` thay vì `around`)
5. Nếu tác vụ liên quan tới nhiều bước (VD: DB schema + Repository + API),
   có thể đọc nhiều file reference liên quan

## Mở rộng skill

Khi gặp một loại tác vụ lặp lại mới (chưa có trong bảng trên), có thể thêm
1 file `.md` mới vào `references/` và bổ sung 1 dòng vào bảng trong file này.
