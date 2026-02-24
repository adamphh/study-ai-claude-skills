# Plugin (Interceptor) Reference

## What is a Plugin?
Plugin là cơ chế cho phép modify behavior của **public methods** mà không cần rewrite class.
Không dùng được cho: `final` classes, `final` methods, `static` methods, `__construct`.

## 3 Types of Plugin

| Type | When it runs | Can change input? | Can change output? |
|------|-------------|-------------------|-------------------|
| `before` | BEFORE the original method | ✅ Yes | ❌ No |
| `after` | AFTER the original method | ❌ No | ✅ Yes |
| `around` | WRAPS the original method | ✅ Yes | ✅ Yes |

> ⚠️ **Prefer `before` or `after` over `around`** — `around` can break the plugin chain if `$proceed` is not called.

---

## Step 1 — Register in di.xml

```xml
<!-- etc/di.xml (global) or etc/frontend/di.xml or etc/adminhtml/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\Catalog\Model\Product">
        <plugin name="vendor_module_product_plugin"
                type="Vendor\Module\Plugin\ProductPlugin"
                disabled="false"
                sortOrder="10"/>
    </type>
</config>
```

- `name`: unique identifier (snake_case)
- `sortOrder`: lower = runs first (for multiple plugins on same method)
- `disabled="true"`: to disable a plugin from another module

---

## Step 2 — Plugin Class

### Before Plugin
```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class ProductPlugin
{
    /**
     * Modify arguments BEFORE setName is called
     * Method name: before + OriginalMethodName (PascalCase)
     * 
     * @return array|null  Return array to modify args, or null to keep original
     */
    public function beforeSetName(Product $subject, string $name): ?array
    {
        // Modify the $name argument
        $name = strtoupper($name);
        
        // Return as array of arguments
        return [$name];
        
        // Return null to keep original arguments unchanged
        // return null;
    }
}
```

### After Plugin
```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class ProductPlugin
{
    /**
     * Modify RESULT AFTER getName is called
     * Method name: after + OriginalMethodName (PascalCase)
     * 
     * @param mixed $result  The original return value
     */
    public function afterGetName(Product $subject, ?string $result): ?string
    {
        if ($result === null) {
            return $result;
        }
        
        // Modify and return the result
        return '[Modified] ' . $result;
    }
}
```

### Around Plugin
```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class ProductPlugin
{
    /**
     * WRAP the original method — you control if/when it executes
     * Method name: around + OriginalMethodName (PascalCase)
     * 
     * @param callable $proceed  MUST call this to execute original method
     */
    public function aroundSave(Product $subject, callable $proceed): Product
    {
        // Code BEFORE original method
        // ... do something before save ...

        // Call the original method (REQUIRED — or you break the chain!)
        $result = $proceed();

        // Code AFTER original method
        // ... do something after save ...

        return $result;
    }
    
    // Around with arguments
    public function aroundSetPrice(
        Product $subject,
        callable $proceed,
        float $price           // ← Original method's arguments come AFTER $proceed
    ): Product {
        if ($price < 0) {
            $price = 0.0;      // Guard: no negative prices
        }
        return $proceed($price);
    }
}
```

---

## Multiple Plugins on Same Method — Execution Order

```
sortOrder=10 (before) → sortOrder=20 (before) → ORIGINAL METHOD
                                              ↓
sortOrder=20 (after)  ← sortOrder=10 (after) ←
```

For `around`: they nest like Russian dolls — inner `$proceed` calls next around plugin.

---

## Real-World Examples

### Example 1: Add custom validation before placing order
```xml
<!-- etc/di.xml -->
<type name="Magento\Sales\Model\Order\Payment">
    <plugin name="vendor_module_payment_validation"
            type="Vendor\Module\Plugin\PaymentValidationPlugin"
            sortOrder="5"/>
</type>
```

```php
public function beforePlace(
    \Magento\Sales\Model\Order\Payment $subject
): ?array {
    // Custom validation — throw exception to stop the order
    if ($someConditionFails) {
        throw new \Magento\Framework\Exception\LocalizedException(
            __('Custom validation failed.')
        );
    }
    return null; // Don't modify arguments
}
```

### Example 2: Add custom data to product after load
```php
public function afterLoad(
    \Magento\Catalog\Model\Product $subject,
    \Magento\Catalog\Model\Product $result
): \Magento\Catalog\Model\Product {
    $result->setData('custom_attribute', $this->customService->getData($result->getId()));
    return $result;
}
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `return $proceed(...)` in around | Always call `$proceed` |
| Plugin on `final` class/method | Use Observer or Preference instead |
| Plugin on `__construct` | Not possible — use `after__construct` via di.xml `arguments` instead |
| Using `around` when `before`/`after` would do | Prefer simpler plugin types |
| Plugin file in wrong directory | Must be in `Plugin/` folder |
