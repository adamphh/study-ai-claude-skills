# Magestore WebPOS Customization Reference

## Architecture Overview

Magestore WebPOS is a ReactJS SPA (Single Page Application) with Magento 2 backend APIs.

```
Frontend (ReactJS):          Backend (Magento 2):
app/code/Magestore/Webpos/   ← PHP module
    view/frontend/web/js/    ← ReactJS source (compiled)
    Api/                     ← PHP interfaces
    Model/                   ← PHP models
    etc/webapi.xml           ← REST API endpoints
```

---

## Backend Customization (PHP)

### Override WebPOS API Behavior via Plugin

```xml
<!-- etc/di.xml -->
<type name="Magestore\Webpos\Api\SomeManagementInterface">
    <plugin name="vendor_custom_webpos_something"
            type="Vendor\CustomWebpos\Plugin\SomeManagementPlugin"/>
</type>
```

### Add Custom Data to WebPOS Product API

Common pattern — add extra fields to product data returned to POS:

```php
<?php
declare(strict_types=1);

namespace Vendor\CustomWebpos\Plugin;

use Magestore\Webpos\Api\Catalog\ProductManagementInterface;

class ProductManagementPlugin
{
    public function afterGetList(
        ProductManagementInterface $subject,
        $result  // SearchResults
    ) {
        foreach ($result->getItems() as $item) {
            // Add custom data to each product
            $customData = $this->getCustomData($item->getId());
            $item->setData('custom_field', $customData);
        }
        return $result;
    }
}
```

### Add Custom REST Endpoint for WebPOS

Follow `references/api.md` pattern, then register in webapi.xml:

```xml
<!-- etc/webapi.xml -->
<route url="/V1/webpos/custom/endpoint" method="GET">
    <service class="Vendor\CustomWebpos\Api\CustomManagementInterface" method="getData"/>
    <resources>
        <resource ref="Magestore_Webpos::webpos"/>
    </resources>
</route>
```

### Observer for WebPOS-Specific Events

WebPOS dispatches its own events. Common ones:
```
webpos_order_place_before      ← Before WebPOS places order
webpos_order_place_after       ← After WebPOS places order  
webpos_shift_open_after        ← After shift opened
webpos_shift_close_after       ← After shift closed
webpos_collect_totals_before   ← Before totals calculated
```

```xml
<!-- etc/events.xml -->
<event name="webpos_order_place_after">
    <observer name="vendor_webpos_order_after"
              instance="Vendor\CustomWebpos\Observer\WebposOrderAfter"/>
</event>
```

---

## Frontend Customization (ReactJS)

> ⚠️ WebPOS frontend is a compiled React app. Direct file edits are **overwritten on upgrade**.
> The proper extension point is via **Magento layout XML + RequireJS/JS mixins** for non-compiled parts,
> or maintaining a **fork/patch** of the React source for deep customization.

### Add Custom Config to WebPOS Frontend

Backend — pass config via `webpos_config` endpoint or layout:

```php
// Model/Config/CustomConfig.php
public function getCustomConfig(): array
{
    return [
        'feature_enabled' => $this->scopeConfig->isSetFlag(
            'webpos/custom/feature_enabled',
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
        ),
        'custom_value' => $this->scopeConfig->getValue(
            'webpos/custom/value'
        ),
    ];
}
```

### Extend WebPOS System Config

```xml
<!-- etc/adminhtml/system.xml -->
<section id="webpos">
    <group id="custom_section" translate="label" type="text" sortOrder="200" showInDefault="1" showInWebsite="1" showInStore="1">
        <label>Custom Settings</label>
        <field id="feature_enabled" translate="label" type="select" sortOrder="10" showInDefault="1">
            <label>Enable Custom Feature</label>
            <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
        </field>
    </group>
</section>
```

---

## Database Tables (WebPOS-specific)

Key tables to know:
```sql
magestore_webpos_session          -- POS sessions
magestore_webpos_shift            -- Shifts (open/close cash drawer)
magestore_webpos_shift_summary    -- Cash summary per shift
magestore_webpos_order_item       -- WebPOS order items (extends sales_order_item)
```

### Joining WebPOS data with orders

```php
$collection = $this->orderCollectionFactory->create();
$collection->getSelect()->joinLeft(
    ['webpos_order' => $collection->getTable('magestore_webpos_order')],
    'main_table.entity_id = webpos_order.order_id',
    ['pos_id', 'session_id', 'shift_id']
);
```

---

## Common WebPOS Customization Scenarios

| Scenario | Approach |
|----------|----------|
| Add custom discount to POS | Plugin on `Magestore\Webpos\Model\Sales\Order\Total\*` |
| Custom payment method for POS | Implement `Magestore\Webpos\Api\PaymentMethod\*Interface` |
| Restrict products shown in POS | Plugin on product collection / `afterGetList` |
| Custom receipt data | Plugin on order API + Observer on `webpos_order_place_after` |
| Custom shift report fields | Plugin on shift management API |
| Sync custom data to POS | Add to WebPOS config API endpoint |

---

## Debugging WebPOS

```bash
# Enable Magento developer mode
bin/magento deploy:mode:set developer

# Check WebPOS specific logs
tail -f var/log/webpos.log

# Clear WebPOS cache/config
bin/magento cache:clean config full_page
bin/magento setup:upgrade
```

Browser console: WebPOS uses Redux DevTools — install the browser extension to inspect state.
