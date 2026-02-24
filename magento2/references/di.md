# Dependency Injection (DI) Reference

## Core Concepts

Magento 2 DI is based on the `di.xml` config file. The ObjectManager reads this config to:
- Map interfaces to implementations (`<preference>`)
- Inject arguments into constructors (`<arguments>`)
- Create virtual types (`<virtualType>`)
- Register plugins (`<type><plugin>`)

---

## preference — Interface to Implementation

```xml
<!-- etc/di.xml -->
<preference for="Vendor\Module\Api\MyInterface"
            type="Vendor\Module\Model\MyImplementation"/>
```

Use case: Bind your API interface to its concrete class, or override a core implementation.

### Override a Core Class (use sparingly — prefer Plugin)
```xml
<preference for="Magento\Catalog\Model\Product"
            type="Vendor\Module\Model\Product"/>
```
⚠️ Preferences cause conflicts when multiple modules override the same class. Use Plugins instead.

---

## type — Configure a Class

### Inject specific arguments
```xml
<type name="Vendor\Module\Model\MyModel">
    <arguments>
        <argument name="connectionName" xsi:type="string">sales</argument>
        <argument name="cacheLifetime" xsi:type="number">3600</argument>
        <argument name="isEnabled" xsi:type="boolean">true</argument>
    </arguments>
</type>
```

### Inject an array argument
```xml
<type name="Magento\Payment\Model\Method\Adapter">
    <arguments>
        <argument name="commandPool" xsi:type="object">VendorPaymentCommandPool</argument>
    </arguments>
</type>

<!-- Inject an array -->
<type name="Vendor\Module\Model\Config">
    <arguments>
        <argument name="allowedStatuses" xsi:type="array">
            <item name="pending" xsi:type="string">pending</item>
            <item name="processing" xsi:type="string">processing</item>
        </argument>
    </arguments>
</type>
```

---

## virtualType — Reuse a Class with Different Arguments

VirtualType creates a named "instance" of a class with specific constructor arguments — without creating a new PHP class file.

```xml
<!-- Create a virtual type: Logger writing to a custom file -->
<virtualType name="VendorModuleLogger" type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">VendorModule</argument>
        <argument name="handlers" xsi:type="array">
            <item name="system" xsi:type="object">VendorModuleLoggerHandler</item>
        </argument>
    </arguments>
</virtualType>

<virtualType name="VendorModuleLoggerHandler" type="Magento\Framework\Logger\Handler\Base">
    <arguments>
        <argument name="fileName" xsi:type="string">/var/log/vendor_module.log</argument>
    </arguments>
</virtualType>

<!-- Inject this virtual logger into your class -->
<type name="Vendor\Module\Model\MyModel">
    <arguments>
        <argument name="logger" xsi:type="object">VendorModuleLogger</argument>
    </arguments>
</type>
```

---

## Scope of di.xml

| File location | When it applies |
|---------------|----------------|
| `etc/di.xml` | All areas (global) |
| `etc/frontend/di.xml` | Frontend only |
| `etc/adminhtml/di.xml` | Admin panel only |
| `etc/webapi_rest/di.xml` | REST API calls only |
| `etc/graphql/di.xml` | GraphQL calls only |

---

## Factory, Repository, and Collection Patterns

### Auto-generated Factory
Magento auto-generates `Factory` classes — just type-hint `ClassNameFactory`:

```php
// In constructor — Magento creates VendorModuleModelEntityFactory automatically
public function __construct(
    \Vendor\Module\Model\EntityFactory $entityFactory
) {
    $this->entityFactory = $entityFactory;
}

// Usage
$entity = $this->entityFactory->create();
$entity = $this->entityFactory->create(['data' => ['name' => 'test']]);
```

### Repository Pattern
```php
// Always use Repository for CRUD, not direct Model/ResourceModel
public function __construct(
    \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
) {}

// Load
$product = $this->productRepository->getById($id);
$product = $this->productRepository->get($sku);

// Save
$this->productRepository->save($product);

// Delete
$this->productRepository->delete($product);
$this->productRepository->deleteById($id);

// Search
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('status', 1)
    ->addFilter('price', 100, 'gteq')
    ->setPageSize(20)
    ->setCurrentPage(1)
    ->create();
$results = $this->productRepository->getList($searchCriteria);
```

### SearchCriteria Builder
```php
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\Api\SortOrderBuilder;
use Magento\Framework\Api\FilterBuilder;

// In constructor:
public function __construct(
    SearchCriteriaBuilder $searchCriteriaBuilder,
    SortOrderBuilder $sortOrderBuilder
) {}

// Usage:
$sortOrder = $this->sortOrderBuilder
    ->setField('created_at')
    ->setDirection('DESC')
    ->create();

$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('status', ['pending', 'processing'], 'in')
    ->addFilter('store_id', 1)
    ->addSortOrder($sortOrder)
    ->setPageSize(50)
    ->create();
```

---

## Proxy — Lazy Loading (Performance)

Use Proxy when injecting a heavy class that isn't always needed:

```xml
<!-- di.xml — auto-generates Vendor\Module\Model\HeavyModel\Proxy -->
<type name="Vendor\Module\Model\MyModel">
    <arguments>
        <argument name="heavyModel" xsi:type="object">Vendor\Module\Model\HeavyModel\Proxy</argument>
    </arguments>
</type>
```

Or in the constructor type-hint:
```php
public function __construct(
    \Vendor\Module\Model\HeavyModel\Proxy $heavyModel  // Only instantiated when first used
) {}
```
