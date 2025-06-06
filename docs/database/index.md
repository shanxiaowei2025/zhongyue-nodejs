# 数据库设计

## 概述

中岳信息管理系统使用MySQL作为主要数据库，通过TypeORM进行对象关系映射。数据库设计遵循标准的关系型数据库设计原则，包括正规化、合理的索引设计等。

## 数据库版本

- MySQL: 8.0+

## 核心数据表

系统包含以下核心数据表：

### 用户相关表

- `sys_user`: 用户基本信息
- `sys_role`: 角色定义
- `sys_permission`: 权限定义
- `sys_user_role`: 用户与角色的关联表
- `sys_role_permission`: 角色与权限的关联表

### 组织结构相关表

- `sys_department`: 部门信息
- `sys_position`: 职位信息
- `sys_user_department`: 用户与部门的关联表

### 客户相关表

- `crm_customer`: 客户基本信息
- `crm_contact`: 客户联系人
- `crm_address`: 客户地址信息

### 合同相关表

- `biz_contract`: 合同基本信息
- `biz_contract_detail`: 合同明细
- `biz_contract_attachment`: 合同附件

### 费用相关表

- `fin_expense`: 费用记录
- `fin_expense_type`: 费用类型
- `fin_payment`: 付款记录

### 文件存储相关表

- `sys_file`: 文件信息记录

## ER图

下面是系统核心模块的实体关系图：

```
+---------------+       +---------------+       +---------------+
|   sys_user    |       |   sys_role    |       | sys_permission|
+---------------+       +---------------+       +---------------+
| id            |<----->| id            |<----->| id            |
| username      |       | name          |       | name          |
| password      |       | code          |       | code          |
| name          |       | description   |       | description   |
| email         |       | created_at    |       | created_at    |
| phone         |       | updated_at    |       | updated_at    |
| status        |       +---------------+       +---------------+
| created_at    |                |
| updated_at    |                |
+---------------+                |
       |                         |
       |                         |
       v                         v
+---------------+       +---------------+
|sys_department |       |  biz_contract |
+---------------+       +---------------+
| id            |       | id            |
| name          |       | number        |
| code          |       | title         |
| parent_id     |       | customer_id   |
| level         |       | amount        |
| sort          |       | status        |
| leader_id     |       | signed_at     |
| created_at    |       | valid_until   |
| updated_at    |       | created_at    |
+---------------+       | updated_at    |
       |                +---------------+
       |                        |
       |                        |
       v                        v
+---------------+       +---------------+
|  crm_customer |       | fin_expense   |
+---------------+       +---------------+
| id            |       | id            |
| name          |       | title         |
| code          |       | amount        |
| type          |       | type_id       |
| level         |       | user_id       |
| status        |       | contract_id   |
| source        |       | status        |
| created_at    |       | created_at    |
| updated_at    |       | updated_at    |
+---------------+       +---------------+
```

## 索引设计

为了提高查询性能，系统在关键字段上建立了索引：

- 所有表的主键使用自增的ID
- 用户名、手机号、邮箱等唯一标识使用唯一索引
- 对于经常用于查询的字段（如状态、创建时间等）建立了普通索引
- 对于需要模糊查询的字段（如名称、标题等）考虑使用全文索引

## 数据迁移

系统使用TypeORM的迁移功能管理数据库结构变更，所有迁移脚本存储在`src/database/migrations`目录下。

## 表结构详细设计

下面是主要表的详细字段定义，包括字段名、类型、长度、约束等信息。

### sys_user 表

| 字段名       | 类型        | 长度  | 约束                 | 说明            |
|-------------|-------------|-------|---------------------|----------------|
| id          | int         |       | PK, AUTO_INCREMENT  | 主键ID          |
| username    | varchar     | 50    | NOT NULL, UNIQUE    | 用户名          |
| password    | varchar     | 100   | NOT NULL            | 密码(加密存储)   |
| name        | varchar     | 50    | NOT NULL            | 姓名            |
| email       | varchar     | 100   | UNIQUE              | 邮箱            |
| phone       | varchar     | 20    | UNIQUE              | 手机号          |
| avatar      | varchar     | 255   |                     | 头像URL         |
| status      | tinyint     |       | DEFAULT 1           | 状态(1:启用,0:禁用) |
| created_at  | datetime    |       | DEFAULT CURRENT_TIMESTAMP | 创建时间   |
| updated_at  | datetime    |       | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| deleted_at  | datetime    |       | NULL                | 软删除时间       |

### sys_department 表

| 字段名       | 类型        | 长度  | 约束                 | 说明            |
|-------------|-------------|-------|---------------------|----------------|
| id          | int         |       | PK, AUTO_INCREMENT  | 主键ID          |
| name        | varchar     | 50    | NOT NULL            | 部门名称        |
| code        | varchar     | 50    | UNIQUE              | 部门编码        |
| parent_id   | int         |       | DEFAULT NULL        | 父部门ID        |
| level       | int         |       | DEFAULT 1           | 层级            |
| sort        | int         |       | DEFAULT 0           | 排序            |
| leader_id   | int         |       | DEFAULT NULL        | 部门负责人ID    |
| created_at  | datetime    |       | DEFAULT CURRENT_TIMESTAMP | 创建时间   |
| updated_at  | datetime    |       | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| deleted_at  | datetime    |       | NULL                | 软删除时间       | 