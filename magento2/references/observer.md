# Observer / Event Reference

## Plugin vs Observer — When to use which?

| Situation | Use |
|-----------|-----|
| Modify method input/output | Plugin |
| React to something that happened (side effect) | **Observer** |
| The class is `final` | Observer |
| You want to send email, log, update DB after an event | **Observer** |
| Multiple modules need to react to same action | **Observer** |

---

## Step 1 — Find or Dispatch an Event

### Common Built-in Events
```
checkout_cart_add_product_complete    ← After product added to cart
sales_order_place_after               ← After order placed
catalog_product_save_after            ← After product saved
customer_login                        ← After customer logs in
customer_register_success             ← After customer registers
controller_action_predispatch         ← Before any controller action
```

Find events in Magento source:
```bash
grep -r "dispatch(" vendor/magento/ --include="*.php" | grep "eventName"
```

### Dispatch a Custom Event
```php
// In your class (inject EventManagerInterface via DI)
use Magento\Framework\Event\ManagerInterface as EventManager;

public function __construct(EventManager $eventManager)
{
    $this->eventManager = $eventManager;
}

public function doSomething(): void
{
    // Business logic...
    
    // Dispatch event — pass any data you want observers to receive
    $this->eventManager->dispatch('vendor_module_something_happened', [
        'order'  => $order,
        'amount' => $amount,
    ]);
}
```

---

## Step 2 — Register Observer in events.xml

```xml
<!-- etc/events.xml (global scope) -->
<!-- Use etc/frontend/events.xml for frontend only -->
<!-- Use etc/adminhtml/events.xml for adminhtml only -->

<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="sales_order_place_after">
        <observer name="vendor_module_order_place_after"
                  instance="Vendor\Module\Observer\OrderPlaceAfter"/>
    </event>
    
    <!-- Multiple observers on same event -->
    <event name="catalog_product_save_after">
        <observer name="vendor_module_product_save"
                  instance="Vendor\Module\Observer\ProductSaveAfter"/>
    </event>
</config>
```

- `name` (event): exact event name string
- `name` (observer): unique identifier, snake_case
- `instance`: fully qualified class name

---

## Step 3 — Observer Class

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Psr\Log\LoggerInterface;

class OrderPlaceAfter implements ObserverInterface
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * @param Observer $observer
     * @return void
     */
    public function execute(Observer $observer): void
    {
        // Get data passed from the dispatch() call
        $order = $observer->getEvent()->getOrder();
        
        if (!$order) {
            return;
        }

        try {
            // Your logic here
            $this->logger->info('Order placed: ' . $order->getIncrementId());
        } catch (\Exception $e) {
            // IMPORTANT: Catch exceptions in observers
            // An uncaught exception here can break the original flow!
            $this->logger->error('Error in OrderPlaceAfter observer: ' . $e->getMessage());
        }
    }
}
```

### Key Rules for Observer Classes
1. **Always implement** `ObserverInterface`
2. **Only one public method**: `execute(Observer $observer): void`
3. **Always wrap in try/catch** — exceptions can break the original transaction
4. **Don't use for time-consuming tasks** — use Message Queue (async) instead
5. Observer **cannot** modify the return value of the method that dispatched the event

---

## Getting Event Data

```php
public function execute(Observer $observer): void
{
    $event = $observer->getEvent();
    
    // Method 1: via getEvent()->getData(key)
    $order  = $event->getData('order');
    $amount = $event->getData('amount');
    
    // Method 2: via getEvent()->getKey() magic getter
    $order  = $event->getOrder();
    $amount = $event->getAmount();
    
    // Method 3: directly from observer (for some core events)
    $product = $observer->getData('product');
}
```

---

## Disabling an Observer (from another module)

```xml
<!-- In YOUR module's events.xml -->
<event name="some_event">
    <observer name="other_module_observer_name" disabled="true"/>
</event>
```

---

## Real-World Example: Send notification after order placed

### etc/events.xml
```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="sales_order_place_after">
        <observer name="vendor_module_send_order_notification"
                  instance="Vendor\Module\Observer\SendOrderNotification"/>
    </event>
</config>
```

### Observer/SendOrderNotification.php
```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Sales\Model\Order;
use Vendor\Module\Model\NotificationService;
use Psr\Log\LoggerInterface;

class SendOrderNotification implements ObserverInterface
{
    public function __construct(
        private NotificationService $notificationService,
        private LoggerInterface $logger
    ) {}

    public function execute(Observer $observer): void
    {
        /** @var Order $order */
        $order = $observer->getEvent()->getOrder();

        if (!$order || !$order->getId()) {
            return;
        }

        try {
            $this->notificationService->send($order);
        } catch (\Exception $e) {
            $this->logger->error(
                'SendOrderNotification failed: ' . $e->getMessage(),
                ['order_id' => $order->getId()]
            );
        }
    }
}
```
