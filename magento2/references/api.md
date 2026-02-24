# REST API / GraphQL Reference

## REST API

### Step 1 — Define Interface (Api/)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api;

/**
 * @api
 */
interface OrderManagementInterface
{
    /**
     * Get order summary
     *
     * @param int $orderId
     * @return \Vendor\Module\Api\Data\OrderSummaryInterface
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function getOrderSummary(int $orderId): \Vendor\Module\Api\Data\OrderSummaryInterface;

    /**
     * Update order status
     *
     * @param int $orderId
     * @param string $status
     * @return bool
     */
    public function updateStatus(int $orderId, string $status): bool;
}
```

### Step 2 — Define Data Interface (Api/Data/)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api\Data;

/**
 * @api
 */
interface OrderSummaryInterface
{
    public const ORDER_ID    = 'order_id';
    public const STATUS      = 'status';
    public const GRAND_TOTAL = 'grand_total';

    public function getOrderId(): int;
    public function setOrderId(int $orderId): self;

    public function getStatus(): string;
    public function setStatus(string $status): self;

    public function getGrandTotal(): float;
    public function setGrandTotal(float $total): self;
}
```

### Step 3 — Implement the Interface (Model/)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Vendor\Module\Api\OrderManagementInterface;
use Vendor\Module\Api\Data\OrderSummaryInterface;
use Vendor\Module\Api\Data\OrderSummaryInterfaceFactory;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Framework\Exception\NoSuchEntityException;

class OrderManagement implements OrderManagementInterface
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private OrderSummaryInterfaceFactory $orderSummaryFactory
    ) {}

    public function getOrderSummary(int $orderId): OrderSummaryInterface
    {
        try {
            $order = $this->orderRepository->get($orderId);
        } catch (\Exception $e) {
            throw new NoSuchEntityException(__('Order with ID %1 not found.', $orderId));
        }

        /** @var OrderSummaryInterface $summary */
        $summary = $this->orderSummaryFactory->create();
        $summary->setOrderId((int)$order->getId())
                ->setStatus($order->getStatus())
                ->setGrandTotal((float)$order->getGrandTotal());

        return $summary;
    }

    public function updateStatus(int $orderId, string $status): bool
    {
        $order = $this->orderRepository->get($orderId);
        $order->setStatus($status);
        $this->orderRepository->save($order);
        return true;
    }
}
```

### Step 4 — Data Model Implementation

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Data;

use Magento\Framework\DataObject;
use Vendor\Module\Api\Data\OrderSummaryInterface;

class OrderSummary extends DataObject implements OrderSummaryInterface
{
    public function getOrderId(): int
    {
        return (int)$this->getData(self::ORDER_ID);
    }

    public function setOrderId(int $orderId): OrderSummaryInterface
    {
        return $this->setData(self::ORDER_ID, $orderId);
    }

    public function getStatus(): string
    {
        return (string)$this->getData(self::STATUS);
    }

    public function setStatus(string $status): OrderSummaryInterface
    {
        return $this->setData(self::STATUS, $status);
    }

    public function getGrandTotal(): float
    {
        return (float)$this->getData(self::GRAND_TOTAL);
    }

    public function setGrandTotal(float $total): OrderSummaryInterface
    {
        return $this->setData(self::GRAND_TOTAL, $total);
    }
}
```

### Step 5 — Bind Interface → Implementation in di.xml

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <!-- Bind interface to implementation -->
    <preference for="Vendor\Module\Api\OrderManagementInterface"
                type="Vendor\Module\Model\OrderManagement"/>
    <preference for="Vendor\Module\Api\Data\OrderSummaryInterface"
                type="Vendor\Module\Model\Data\OrderSummary"/>
</config>
```

### Step 6 — Expose via webapi.xml

```xml
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">

    <!-- GET /V1/vendor-module/order/:orderId -->
    <route url="/V1/vendor-module/order/:orderId" method="GET">
        <service class="Vendor\Module\Api\OrderManagementInterface" method="getOrderSummary"/>
        <resources>
            <resource ref="Magento_Sales::sales"/>
            <!-- Use "anonymous" for public APIs (no auth required) -->
            <!-- <resource ref="anonymous"/> -->
        </resources>
    </route>

    <!-- PUT /V1/vendor-module/order/:orderId/status -->
    <route url="/V1/vendor-module/order/:orderId/status" method="PUT">
        <service class="Vendor\Module\Api\OrderManagementInterface" method="updateStatus"/>
        <resources>
            <resource ref="Magento_Sales::sales"/>
        </resources>
    </route>
</routes>
```

### Testing REST API
```bash
# Get token
curl -X POST "https://your-store.com/rest/V1/integration/admin/token" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Call API
curl -X GET "https://your-store.com/rest/V1/vendor-module/order/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## GraphQL API

### Step 1 — Define schema in etc/schema.graphqls

```graphql
# etc/schema.graphqls

type Query {
    vendorOrder(id: Int! @doc(description: "Order ID")): VendorOrderOutput
        @resolver(class: "Vendor\\Module\\Model\\Resolver\\OrderResolver")
        @doc(description: "Get vendor order summary")
        @cache(cacheIdentity: "Vendor\\Module\\Model\\Resolver\\Cache\\OrderIdentity")
}

type Mutation {
    updateVendorOrderStatus(
        order_id: Int!
        status: String!
    ): Boolean
        @resolver(class: "Vendor\\Module\\Model\\Resolver\\UpdateOrderStatusResolver")
        @doc(description: "Update order status")
}

type VendorOrderOutput @doc(description: "Order summary output") {
    order_id: Int       @doc(description: "Order ID")
    status: String      @doc(description: "Order status")
    grand_total: Float  @doc(description: "Grand total")
}
```

### Step 2 — Resolver Class

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Vendor\Module\Api\OrderManagementInterface;

class OrderResolver implements ResolverInterface
{
    public function __construct(
        private OrderManagementInterface $orderManagement
    ) {}

    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if (!isset($args['id'])) {
            throw new GraphQlInputException(__('Order ID is required.'));
        }

        try {
            $summary = $this->orderManagement->getOrderSummary((int)$args['id']);
            return [
                'order_id'    => $summary->getOrderId(),
                'status'      => $summary->getStatus(),
                'grand_total' => $summary->getGrandTotal(),
            ];
        } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
            throw new GraphQlNoSuchEntityException(__($e->getMessage()), $e);
        }
    }
}
```

### Testing GraphQL
```bash
curl -X POST "https://your-store.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ vendorOrder(id: 1) { order_id status grand_total } }"
  }'
```

---

## ACL for REST API

```xml
<!-- etc/acl.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Vendor_Module::vendor_module" title="Vendor Module" sortOrder="100">
                    <resource id="Vendor_Module::order_view" title="View Orders" sortOrder="10"/>
                    <resource id="Vendor_Module::order_edit" title="Edit Orders" sortOrder="20"/>
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```
