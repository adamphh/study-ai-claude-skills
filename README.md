# study-ai-claude-skills

## Skills là gì?
Hãy tưởng tượng Skills giống như *"hướng dẫn sử dụng chuyên biệt"* mà bạn đưa cho tôi trước khi làm một công việc cụ thể.
Ví dụ: Bạn thuê một thợ mộc. Thay vì để anh ta tự mày mò cách làm tủ theo kiểu của mình, bạn đưa cho anh ta một *quyển sổ tay* ghi rõ: dùng loại gỗ nào, kích thước chuẩn, cách đóng đinh, cách xử lý bề mặt... Đó chính là Skill.

## Cấu trúc của một Skill
Mỗi Skill thực chất là một *thư mục* chứa file SKILL.md (và có thể kèm các file hỗ trợ). 
File SKILL.md là trái tim của Skill, thường bao gồm:
/mnt/skills/
  └── public/
      └── docx/
          └── SKILL.md   ← File hướng dẫn chính
      └── pptx/
          └── SKILL.md
  └── user/              ← Skills do bạn tạo
      └── my-skill/
          └── SKILL.md

Trong SKILL.md, bạn sẽ viết:
- **Skill Name**
- **Mục đích**
    Skill này dùng để làm gì
- **Mô tả chi tiết** về nhiệm vụ và cách thực hiện.

- **Các quy tắc và nguyên tắc** cần tuân theo.

- **Tham chiếu** đến các tài liệu hoặc file hướng dẫn cụ thể.

- **Khi nào dùng**
    Trigger conditions
- **Các bước thực hiện**
    Bước 1: ...
    Bước 2: ...
    ...

- **Các ví dụ minh họa** để làm rõ cách áp dụng.
- **Các lưu ý đặc biệt** nếu có.
    Những điều cần tránh
    Best practices
- **Các lỗi thường gặp** và cách khắc phục (nếu có).

## Cách Skills hoạt động trong thực tế
    Khi bạn yêu cầu tôi làm gì đó (ví dụ: "tạo file Word"), tôi sẽ:
1. Kiểm tra xem có Skill nào phù hợp với yêu cầu của bạn không.
2. Nếu có, tôi sẽ đọc kỹ SKILL.md của Skill đó để hiểu rõ cách
3. Làm theo hướng dẫn trong file đó thay vì tự phán đoán

## Cách test một Skill
Cách đơn giản nhất:
1. Yêu cầu tôi đọc skill → "Hãy đọc skill tại /mnt/skills/user/my-skill/SKILL.md và làm theo"
2. Quan sát output → Có đúng với kỳ vọng không?
3. Tinh chỉnh SKILL.md → Thêm ví dụ, làm rõ hướng dẫn, bổ sung edge cases
4. Lặp lại cho đến khi kết quả ổn định

## Ví dụ
magento2/
├── SKILL.md                   ← 128 lines — Router chính
└── references/
    ├── module-structure.md    ← Cấu trúc module, Model/ResourceModel/Collection, DB Schema
    ├── plugin.md              ← Before/After/Around plugin, sortOrder, common mistakes
    ├── observer.md            ← Events, dispatch, ObserverInterface, try/catch rules
    ├── api.md                 ← REST API (webapi.xml) + GraphQL (schema.graphqls + Resolver)
    ├── di.md                  ← preference, virtualType, Factory, Repository, SearchCriteria
    └── webpos.md              ← Magestore WebPOS backend + frontend customization
### Cách dùng skill này
- "Tạo observer cho event sales_order_place_after trong module Magestore_CustomOrder"
- "Viết plugin around cho method getPrice() của Product"
- "Tạo REST API endpoint để lấy danh sách ca làm việc WebPOS"

## Hướng dẫn cài đặt Skill vào Claude.ai
- Điều kiện tiên quyết Skills có sẵn cho tất cả các plan: Free, Pro, Max, Team và Enterprise. 
*Tính năng này yêu cầu Code execution phải được bật.*
### Bước 1 — Nén thư mục skill thành file ZIP
Lấy thư mục magento2/ bạn vừa download, nén lại thành magento2.zip. Cấu trúc bên trong ZIP phải là:
magento2/
├── SKILL.md
└── references/
    ├── plugin.md
    ├── observer.md
    ├── module-structure.md
    ├── api.md
    ├── di.md
    └── webpos.md
*** Quan trọng: ZIP phải chứa thư mục magento2/ bên trong, không phải chỉ các file rời. ***

### Bước 2 — Upload lên Claude.ai
Vào *Settings > Capabilities*, đảm bảo *Code execution and file creation* đang bật. 
Kéo xuống phần *Skills*, click *"Upload skill"* và upload file ZIP của bạn. Claude
Sau khi upload, skill sẽ xuất hiện trong danh sách Skills của bạn và có thể bật/tắt bất kỳ lúc nào.

### Bước 3 — Bật skill và kiểm tra
Sau khi upload, toggle skill ON. Mở một conversation mới và thử:
```"Tạo cho tôi một plugin around để modify giá sản phẩm trong Magento 2"```
Bạn sẽ thấy tôi tự động đọc references/plugin.md và generate code đúng chuẩn.

### Lưu ý quan trọng
Custom Skills trên Claude.ai là riêng tư cho từng user — không chia sẻ được với đồng nghiệp. Nếu bạn dùng Team hoặc Enterprise plan và muốn toàn bộ team cùng dùng một skill, cần liên hệ Organization Owner để provision skill cho cả tổ chức. 
Claude API Docs (https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
Tức là nếu cả team muốn dùng skill Magento 2 này, mỗi người phải tự upload vào account của mình (trừ khi công ty bạn đang dùng Team/Enterprise plan).
