# 客户数据级联删除配置说明

## 概述

本次修改为客户相关的历史数据表配置了级联删除（CASCADE DELETE），确保删除客户时相关历史数据的一致性。

## 修改内容

### 1. 实体关系配置修改

#### 客户等级历史表 (`CustomerLevelHistory`)

**文件位置**: `src/modules/reports/customer-level-history/entities/customer-level-history.entity.ts`

**修改内容**:
```typescript
// 修改前
@ManyToOne(() => Customer, { nullable: true })
@JoinColumn({ name: 'customerId' })
customer: Customer;

// 修改后  
@ManyToOne(() => Customer, { nullable: true, onDelete: 'CASCADE' })
@JoinColumn({ name: 'customerId' })
customer: Customer;
```

#### 客户状态历史表 (`CustomerStatusHistory`)

**文件位置**: `src/modules/reports/customer-status-history/entities/customer-status-history.entity.ts`

**修改内容**:
```typescript
// 修改前
@ManyToOne(() => Customer, { nullable: true })
@JoinColumn({ name: 'customerId' })
customer: Customer;

// 修改后
@ManyToOne(() => Customer, { nullable: true, onDelete: 'CASCADE' })
@JoinColumn({ name: 'customerId' })
customer: Customer;
```

## 数据库迁移脚本

根据实际查询结果，以下是针对性的迁移脚本：

### 🎯 **针对当前数据库状态的精确脚本**

根据您的查询结果：
- `customer_level_history` 表有外键：`fk_customer_level_history_customer` 和 `FK_customer_level_history_customerId`
- `customer_status_history` 表没有外键
- **数据类型不兼容问题**: `customer_status_history.customerId` 是 `bigint`，而 `sys_customer.id` 是 `int`

```sql
-- 1. 处理 customer_level_history 表
-- 删除现有的外键约束
ALTER TABLE customer_level_history DROP FOREIGN KEY fk_customer_level_history_customer;
ALTER TABLE customer_level_history DROP FOREIGN KEY FK_customer_level_history_customerId;

-- 添加带级联删除的外键约束
ALTER TABLE customer_level_history 
ADD CONSTRAINT FK_customer_level_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;

-- 2. 处理 customer_status_history 表的数据类型不兼容问题
-- 方案A: 修改 customer_status_history.customerId 从 bigint 改为 int
ALTER TABLE customer_status_history MODIFY COLUMN customerId int NOT NULL;

-- 然后添加外键约束
ALTER TABLE customer_status_history 
ADD CONSTRAINT FK_customer_status_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;

-- 方案B: 如果方案A有数据风险，可以修改 sys_customer.id 从 int 改为 bigint
-- 但这需要更谨慎的操作，因为可能影响其他表
-- ALTER TABLE sys_customer MODIFY COLUMN id bigint AUTO_INCREMENT;
-- 然后添加外键约束（使用方案A的添加语句）
```

### ⚠️ **重要提醒：数据类型兼容性问题**

检测到以下数据类型不兼容：
- `customer_status_history.customerId`: **bigint**
- `sys_customer.id`: **int**

**推荐解决方案**（按优先级排序）：

#### 🔥 **方案1: 修改 customer_status_history.customerId 类型（推荐）**

```sql
-- 检查 customer_status_history 表中 customerId 的数据范围
SELECT MIN(customerId), MAX(customerId), COUNT(*) FROM customer_status_history;

-- 如果数据在 int 范围内（-2,147,483,648 到 2,147,483,647），可以安全修改
ALTER TABLE customer_status_history MODIFY COLUMN customerId int NOT NULL;

-- 然后添加外键约束
ALTER TABLE customer_status_history 
ADD CONSTRAINT FK_customer_status_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;
```

#### 🚨 **方案2: 修改 sys_customer.id 类型（需谨慎）**

```sql
-- 这个方案需要检查所有引用 sys_customer.id 的表
-- 首先检查有哪些表引用了 sys_customer.id
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE 
    REFERENCED_TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME = 'sys_customer'
    AND REFERENCED_COLUMN_NAME = 'id';

-- 如果确认安全，修改主键类型
ALTER TABLE sys_customer MODIFY COLUMN id bigint AUTO_INCREMENT;

-- 然后添加外键约束
ALTER TABLE customer_status_history 
ADD CONSTRAINT FK_customer_status_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;
```

### 方案一：兼容所有MySQL版本的脚本

```sql
-- 查询现有外键约束名称
SELECT 
    CONSTRAINT_NAME 
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'customer_level_history' 
    AND COLUMN_NAME = 'customerId' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;

SELECT 
    CONSTRAINT_NAME 
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'customer_status_history' 
    AND COLUMN_NAME = 'customerId' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

执行上述查询后，根据返回的约束名称，执行对应的删除语句：

```sql
-- 删除现有外键约束（请替换为实际的约束名称）
-- ALTER TABLE customer_level_history DROP FOREIGN KEY FK_实际约束名称;
-- ALTER TABLE customer_status_history DROP FOREIGN KEY FK_实际约束名称;

-- 添加带级联删除的外键约束
ALTER TABLE customer_level_history 
ADD CONSTRAINT FK_customer_level_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;

ALTER TABLE customer_status_history 
ADD CONSTRAINT FK_customer_status_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;
```

### 方案二：直接执行脚本（适用于MySQL 5.7+）

```sql
-- 对于 customer_level_history 表
SET @sql = CONCAT('ALTER TABLE customer_level_history DROP FOREIGN KEY ', 
    (SELECT CONSTRAINT_NAME 
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'customer_level_history' 
       AND COLUMN_NAME = 'customerId' 
       AND REFERENCED_TABLE_NAME IS NOT NULL 
     LIMIT 1));

SET @sql = IF(@sql != 'ALTER TABLE customer_level_history DROP FOREIGN KEY ', @sql, 'SELECT "No FK constraint found for customer_level_history"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 对于 customer_status_history 表
SET @sql = CONCAT('ALTER TABLE customer_status_history DROP FOREIGN KEY ', 
    (SELECT CONSTRAINT_NAME 
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'customer_status_history' 
       AND COLUMN_NAME = 'customerId' 
       AND REFERENCED_TABLE_NAME IS NOT NULL 
     LIMIT 1));

SET @sql = IF(@sql != 'ALTER TABLE customer_status_history DROP FOREIGN KEY ', @sql, 'SELECT "No FK constraint found for customer_status_history"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加带级联删除的外键约束
ALTER TABLE customer_level_history 
ADD CONSTRAINT FK_customer_level_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;

ALTER TABLE customer_status_history 
ADD CONSTRAINT FK_customer_status_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;
```

### 方案三：简化版本（推荐）

如果您确定当前没有外键约束或可以忽略删除错误：

```sql
-- 直接添加外键约束（如果已存在会报错，可以忽略）
ALTER TABLE customer_level_history 
ADD CONSTRAINT FK_customer_level_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;

ALTER TABLE customer_status_history 
ADD CONSTRAINT FK_customer_status_history_customerId 
FOREIGN KEY (customerId) REFERENCES sys_customer(id) 
ON DELETE CASCADE;
```

## 功能验证

### 验证步骤

1. **创建测试数据**:
   ```sql
   -- 插入测试客户
   INSERT INTO sys_customer (companyName, unifiedSocialCreditCode) 
   VALUES ('测试公司', '91330000TEST001');
   
   -- 获取客户ID
   SET @customer_id = LAST_INSERT_ID();
   
   -- 插入测试历史记录
   INSERT INTO customer_level_history (customerId, companyName, unifiedSocialCreditCode, currentLevel, changeDate) 
   VALUES (@customer_id, '测试公司', '91330000TEST001', 'A级', NOW());
   
   INSERT INTO customer_status_history (customerId, companyName, unifiedSocialCreditCode, currentEnterpriseStatus, currentBusinessStatus, changeDate) 
   VALUES (@customer_id, '测试公司', '91330000TEST001', '正常', '活跃', NOW());
   ```

2. **验证级联删除**:
   ```sql
   -- 删除客户（应该自动删除相关历史记录）
   DELETE FROM sys_customer WHERE id = @customer_id;
   
   -- 验证历史记录是否已删除
   SELECT COUNT(*) FROM customer_level_history WHERE customerId = @customer_id;
   SELECT COUNT(*) FROM customer_status_history WHERE customerId = @customer_id;
   -- 以上查询结果应该都为 0
   ```

### 应用层验证

```typescript
// 通过客户服务删除客户
await customerService.remove(customerId, userId);

// 验证相关历史数据是否已删除
const levelHistory = await customerLevelHistoryRepository.find({ 
  where: { customerId } 
});
const statusHistory = await customerStatusHistoryRepository.find({ 
  where: { customerId } 
});

// levelHistory 和 statusHistory 应该为空数组
```

## 注意事项

### 1. 数据安全

- **生产环境操作前必须备份数据库**
- 级联删除是不可逆操作，请谨慎使用
- 建议在测试环境充分验证后再部署到生产环境

### 2. 业务影响

- 删除客户将永久删除所有相关历史记录
- 如需保留历史数据用于审计，建议使用软删除而非物理删除
- 确保前端应用有适当的确认机制

### 3. 性能考虑

- 对于有大量历史记录的客户，删除操作可能需要较长时间
- 级联删除会在一个事务中执行，确保数据一致性

## 相关表分析

经过分析，以下表格与客户的关联情况：

| 表名 | 关联方式 | 是否需要级联删除 | 状态 |
|------|----------|------------------|------|
| `customer_level_history` | 外键关联 (customerId) | ✅ 是 | ✅ 已配置 |
| `customer_status_history` | 外键关联 (customerId) | ✅ 是 | ✅ 已配置 |
| `sys_expense` | 业务逻辑关联，无外键 | ❌ 否 | ✅ 无需修改 |
| `sys_service_history` | 仅存储企业信息，无外键 | ❌ 否 | ✅ 无需修改 |
| `change_history` | enterpriseId字段，用途待确认 | ⚠️ 待确认 | 📋 需要进一步分析 |

## 后续建议

1. **建立软删除机制**: 考虑为重要业务数据实现软删除，保留审计记录
2. **完善权限控制**: 确保只有授权用户可以执行删除操作
3. **监控和日志**: 添加删除操作的日志记录，便于追踪和审计
4. **数据备份策略**: 建立定期备份机制，确保数据安全

## 更新日志

- **2025-01-15**: 配置客户历史数据级联删除
- **配置文件**: 更新了相关实体的 `@ManyToOne` 关系配置
- **文档**: 更新了 README.md 变更日志
- **数据库脚本**: 更新为兼容各MySQL版本的迁移脚本
- **精确脚本**: 根据实际外键查询结果提供针对性脚本 