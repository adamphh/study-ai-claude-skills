# Module Structure Reference

## Full Module Directory Layout

```
app/code/Vendor/Module/
├── registration.php
├── composer.json                  ← Optional but recommended
├── etc/
│   ├── module.xml                 ← Required
│   ├── di.xml                     ← DI config (plugins, preferences, virtualTypes)
│   ├── events.xml                 ← Observer registration
│   ├── acl.xml                    ← ACL resources
│   ├── config.xml                 ← Default config values
│   ├── adminhtml/
│   │   ├── di.xml                 ← Admin-specific DI
│   │   ├── events.xml             ← Admin-specific observers
│   │   ├── routes.xml             ← Admin routes
│   │   └── menu.xml               ← Admin menu
│   ├── frontend/
│   │   ├── di.xml
│   │   ├── events.xml
│   │   └── routes.xml             ← Frontend routes
│   └── webapi.xml                 ← REST API endpoints
│
├── Api/                           ← Public interfaces (@api)
│   ├── DataInterface.php
│   └── RepositoryInterface.php
│
├── Api/Data/                      ← Data interfaces
│   └── EntityInterface.php
│
├── Model/                         ← Business logic
│   ├── Entity.php                 ← Model (extends AbstractModel)
│   ├── Repository.php             ← Repository implementation
│   └── ResourceModel/
│       ├── Entity.php             ← ResourceModel (extends AbstractDb)
│       └── Entity/
│           └── Collection.php     ← Collection (extends AbstractCollection)
│
├── Block/                         ← View blocks
│   ├── Index.php
│   └── Adminhtml/
│       └── Grid.php
│
├── Controller/                    ← Controllers
│   ├── Index/
│   │   └── Index.php
│   └── Adminhtml/
│       └── Entity/
│           ├── Index.php
│           ├── Save.php
│           └── Delete.php
│
├── Observer/                      ← Event observers
│   └── SomeEventObserver.php
│
├── Plugin/                        ← Plugins (interceptors)
│   └── SomeClassPlugin.php
│
├── Setup/                         ← Install/upgrade scripts
│   ├── InstallSchema.php          ← 2.3.x
│   ├── UpgradeSchema.php          ← 2.3.x
│   └── Patch/
│       └── Data/
│           └── AddSomeData.php    ← 2.4.x Data Patch (preferred)
│
├── view/
│   ├── frontend/
│   │   ├── layout/
│   │   │   └── some_route_index.xml
│   │   └── templates/
│   │       └── index.phtml
│   └── adminhtml/
│       └── layout/
│           └── adminhtml_entity_index.xml
│
└── i18n/
    └── en_US.csv
```

---

## Step-by-Step: Creating a New Module

### Step 1 — registration.php
(See SKILL.md for boilerplate)

### Step 2 — etc/module.xml
```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_Module" setup_version="1.0.0">
        <sequence>
            <!-- Modules this one depends on -->
            <module name="Magento_Catalog"/>
        </sequence>
    </module>
</config>
```

### Step 3 — composer.json (optional but best practice)
```json
{
    "name": "vendor/module-name",
    "description": "Module description",
    "type": "magento2-module",
    "version": "1.0.0",
    "require": {
        "php": "~7.4.0||~8.1.0",
        "magento/framework": "*"
    },
    "autoload": {
        "files": ["registration.php"],
        "psr-4": {
            "Vendor\\Module\\": ""
        }
    }
}
```

---

## Model / ResourceModel / Collection Pattern

### Model
```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Framework\Model\AbstractModel;

class Entity extends AbstractModel
{
    protected function _construct(): void
    {
        $this->_init(\Vendor\Module\Model\ResourceModel\Entity::class);
    }
}
```

### ResourceModel
```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class Entity extends AbstractDb
{
    protected function _construct(): void
    {
        $this->_init('vendor_module_entity', 'entity_id');
        //             ^ table name           ^ primary key
    }
}
```

### Collection
```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\ResourceModel\Entity;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected function _construct(): void
    {
        $this->_init(
            \Vendor\Module\Model\Entity::class,
            \Vendor\Module\Model\ResourceModel\Entity::class
        );
    }
}
```

---

## Database Schema

### 2.4.x — db_schema.xml (Declarative Schema, preferred)
```xml
<!-- etc/db_schema.xml -->
<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
    <table name="vendor_module_entity" resource="default" engine="innodb" comment="Vendor Module Entity">
        <column xsi:type="int" name="entity_id" unsigned="true" nullable="false" identity="true" comment="Entity ID"/>
        <column xsi:type="varchar" name="name" nullable="false" length="255" comment="Name"/>
        <column xsi:type="text" name="description" nullable="true" comment="Description"/>
        <column xsi:type="timestamp" name="created_at" on_update="false" nullable="false" default="CURRENT_TIMESTAMP"/>
        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="entity_id"/>
        </constraint>
    </table>
</schema>
```

### 2.3.x — InstallSchema.php
```php
<?php
namespace Vendor\Module\Setup;

use Magento\Framework\Setup\InstallSchemaInterface;
use Magento\Framework\Setup\ModuleContextInterface;
use Magento\Framework\Setup\SchemaSetupInterface;

class InstallSchema implements InstallSchemaInterface
{
    public function install(SchemaSetupInterface $setup, ModuleContextInterface $context): void
    {
        $setup->startSetup();
        $table = $setup->getConnection()->newTable(
            $setup->getTable('vendor_module_entity')
        )->addColumn('entity_id', \Magento\Framework\DB\Ddl\Table::TYPE_INTEGER, null, [
            'identity' => true, 'unsigned' => true, 'nullable' => false, 'primary' => true
        ])->addColumn('name', \Magento\Framework\DB\Ddl\Table::TYPE_TEXT, 255, ['nullable' => false]);
        $setup->getConnection()->createTable($table);
        $setup->endSetup();
    }
}
```
