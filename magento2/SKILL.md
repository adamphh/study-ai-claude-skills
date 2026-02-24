---
name: magento2
description: >
  Expert guide for Magento 2 (2.3.x and 2.4.x) development following official Magento coding standards.
  Use this skill whenever the user asks to create, modify, or debug anything related to Magento 2 modules,
  plugins, observers, events, REST/GraphQL APIs, or Magestore WebPOS customization — even if they don't
  explicitly say "Magento". Triggers include: "tạo module", "viết plugin", "tạo observer", "add API endpoint",
  "customize WebPOS", "tạo event", "dependency injection", "di.xml", "events.xml", "webapi.xml", or any
  request involving Magento file paths like app/code, registration.php, module.xml.
---

# Magento 2 Development Skill

## Compatibility
- Magento 2.3.x and 2.4.x (note differences where they exist)
- PHP 7.4+ (2.3.x), PHP 8.1+ (2.4.x)
- Follows official Magento coding standards (PSR-1, PSR-2, PSR-4)

---

## Quick Reference — Which file to read

Based on the task, read the relevant reference file BEFORE writing any code:

| Task | Reference File |
|------|---------------|
| Tạo module mới từ đầu | `references/module-structure.md` |
| Tạo Plugin (before/after/around) | `references/plugin.md` |
| Tạo Observer / Event | `references/observer.md` |
| Tạo REST API / GraphQL | `references/api.md` |
| Customize Magestore WebPOS | `references/webpos.md` |
| Dependency Injection, di.xml | `references/di.md` |

**Rule**: Always read the reference file first. Never guess at file structure or config syntax.

---

## Universal Rules (apply to ALL tasks)

### Namespace & File Location
```
Vendor/Module → app/code/Vendor/Module/
```
- Vendor name: PascalCase (e.g., `Magestore`, `Magento`)
- Module name: PascalCase (e.g., `CustomCheckout`, `SalesRule`)
- All PHP classes: PSR-4, namespace matches directory

### Every Module Must Have
```
app/code/Vendor/Module/
├── registration.php          ← Always required
└── etc/
    └── module.xml            ← Always required
```

### registration.php (boilerplate — never change structure)
```php
<?php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Vendor_Module',
    __DIR__
);
```

### module.xml (minimum viable)
```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_Module" setup_version="1.0.0">
        <!-- Add <sequence> here if this module depends on others -->
    </module>
</config>
```

### Dependency Injection — Constructor Pattern
```php
// ALWAYS inject via constructor. NEVER use ObjectManager directly.
public function __construct(
    \Magento\Catalog\Api\ProductRepositoryInterface $productRepository,
    \Psr\Log\LoggerInterface $logger
) {
    $this->productRepository = $productRepository;
    $this->logger = $logger;
}
```

### Coding Standards Checklist
- [ ] `declare(strict_types=1);` at top of every PHP file
- [ ] Type hints on all method parameters and return types
- [ ] `protected` properties with `$this->` (not `public`)
- [ ] No direct SQL — use Collection or Repository pattern
- [ ] No `ObjectManager::getInstance()` — always use DI
- [ ] `@api` annotation on public interfaces meant for extension
- [ ] Exceptions: catch specific exceptions, log with `$this->logger`

### Version Differences (2.3 vs 2.4)
| Feature | 2.3.x | 2.4.x |
|---------|-------|-------|
| PHP | 7.3 / 7.4 | 8.1+ |
| Elasticsearch | Optional | Required |
| `setup_version` in module.xml | Required | Deprecated (use `db_schema.xml`) |
| 2FA | Optional | Required |
| `Union types` PHP syntax | ❌ | ✅ |

---

## After Writing Code — Always Remind User

```bash
# Enable module
bin/magento module:enable Vendor_Module

# Run setup upgrade (for new modules or schema changes)  
bin/magento setup:upgrade

# Recompile DI (after any di.xml or new class changes)
bin/magento setup:di:compile

# Clear cache
bin/magento cache:clean
bin/magento cache:flush
```

> In **developer mode**, `setup:di:compile` is optional but `cache:clean` is always needed.
