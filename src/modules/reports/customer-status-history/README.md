# 客户状态历史管理模块

## 功能概述

本模块实现了客户企业状态和业务状态变更历史的记录和查询功能，支持基于历史记录的客户流失统计分析。与客户等级分布统计使用相同的时间点状态还原机制，确保报表数据的准确性和一致性。

## 主要功能

### 1. 客户状态历史记录
- 自动记录客户企业状态和业务状态变更历史
- 支持手动创建状态历史记录
- 记录变更原因、操作人员等详细信息
- 支持双状态跟踪（企业状态 + 业务状态）

### 2. 历史数据查询
- 根据条件查询状态变更历史
- 获取客户在指定时间点的状态信息
- 批量查询多个客户的历史状态
- 支持流失客户识别和统计

### 3. 客户流失统计集成
- **与客户等级分布统计相同的处理机制**
- 基于历史记录实现精确的时间点状态还原
- 支持按年月查询特定时间段的流失情况
- 提供流失原因分析和统计

## 数据库表结构

### customer_status_history 表
- `id`: 主键
- `customerId`: 客户ID（外键）
- `companyName`: 企业名称（冗余字段）
- `unifiedSocialCreditCode`: 统一社会信用代码（冗余字段）
- `previousEnterpriseStatus`: 变更前企业状态
- `currentEnterpriseStatus`: 变更后企业状态
- `previousBusinessStatus`: 变更前业务状态
- `currentBusinessStatus`: 变更后业务状态
- `changeDate`: 变更日期
- `changeReason`: 变更原因
- `changedBy`: 操作人员
- `remarks`: 备注信息
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### 索引优化
```sql
-- 复合索引：客户ID + 变更日期（用于时间点查询）
KEY `idx_customer_status_history_customerId_changeDate` (`customerId`, `changeDate`)

-- 单独索引：变更日期（用于时间范围查询）
KEY `idx_customer_status_history_changeDate` (`changeDate`)

-- 其他查询索引
KEY `idx_customer_status_history_unifiedSocialCreditCode` (`unifiedSocialCreditCode`)
KEY `idx_customer_status_history_companyName` (`companyName`)
KEY `idx_customer_status_history_currentEnterpriseStatus` (`currentEnterpriseStatus`)
KEY `idx_customer_status_history_currentBusinessStatus` (`currentBusinessStatus`)
```

## API 接口

### 1. 创建状态历史记录
```
POST /api/reports/customer-status-history
```
管理员权限，手动创建状态历史记录。

### 2. 查询状态历史记录
```
GET /api/reports/customer-status-history
```
支持多种查询条件：客户ID、企业名称、状态类型、时间范围等。

### 3. 查询特定客户的状态历史
```
GET /api/reports/customer-status-history/customer/:customerId
```
获取指定客户的所有状态变更历史。

### 4. 查询指定时间点的客户状态
```
GET /api/reports/customer-status-history/status-at-time?customerId=1&targetDate=2025-01-15
```
获取客户在特定日期的状态信息。

### 5. 批量查询客户状态
```
GET /api/reports/customer-status-history/batch-status-at-time?customerIds=1,2,3&targetDate=2025-01-15
```
批量获取多个客户在特定日期的状态信息。

## 核心逻辑

### 1. 状态变更检测
当客户信息更新时，系统会自动检测 `enterpriseStatus` 和 `businessStatus` 字段是否发生变化，如有变化则创建历史记录。

### 2. 历史状态查询
查询客户在指定时间点的状态时，系统会：
1. 查找该客户在目标日期之前的最新状态记录
2. 如果没有历史记录，则返回客户当前状态
3. 判断是否为流失状态（`cancelled` 或 `lost`）

### 3. 客户流失统计实现
采用与客户等级分布统计完全相同的逻辑：

```typescript
// 1. 确定查询的截止日期
const targetDate = this.getTargetDateForHistory(query.year, query.month);

// 2. 基于历史记录表统计流失情况
const churnResults = await this.getCustomerChurnStatsFromHistory(
  targetDate, 
  customerFilter
);

// 3. 使用子查询找出每个客户在目标日期的最新状态
// 4. 过滤出状态为 cancelled 或 lost 的记录
// 5. 应用权限控制和数据过滤
```

## 与客户等级分布统计的一致性

### 相同的处理机制
1. **时间点确定**：使用相同的 `getTargetDateForHistory()` 方法
2. **历史记录查询**：采用相同的子查询模式找出最新记录
3. **权限控制**：使用相同的客户数据权限过滤逻辑
4. **缓存策略**：采用相同的缓存时间（2小时）
5. **参数处理**：支持相同的年月参数格式

### 查询参数兼容性
```javascript
// 支持的查询参数格式与客户等级分布统计完全一致
{
  "year": 2024,        // 可选：年份
  "month": 6           // 可选：月份
}

// 查询逻辑：
// - 只传 year：统计该年度的流失情况
// - 传 year + month：统计该年月的流失情况  
// - 只传 month：统计当年该月的流失情况
// - 都不传：统计当前年月的流失情况
```

## 自动化集成

### 客户状态变更自动记录
在 `CustomerService.update()` 方法中集成：

```typescript
// 检查客户状态是否有变化
const enterpriseStatusChanged = 
  updateCustomerDto.enterpriseStatus !== undefined &&
  updateCustomerDto.enterpriseStatus !== existingCustomer.enterpriseStatus;

const businessStatusChanged = 
  updateCustomerDto.businessStatus !== undefined &&
  updateCustomerDto.businessStatus !== existingCustomer.businessStatus;

// 如果状态有变化，自动创建历史记录
if (enterpriseStatusChanged || businessStatusChanged) {
  await statusHistoryRepository.save({
    customerId: existingCustomer.id,
    companyName: existingCustomer.companyName,
    unifiedSocialCreditCode: existingCustomer.unifiedSocialCreditCode,
    previousEnterpriseStatus: existingCustomer.enterpriseStatus,
    currentEnterpriseStatus: updatedCustomer.enterpriseStatus,
    previousBusinessStatus: existingCustomer.businessStatus,
    currentBusinessStatus: updatedCustomer.businessStatus,
    changeDate: new Date(),
    changeReason: '客户状态更新',
    changedBy: user.username,
  });
}
```

## 流失状态定义

### 企业状态 (enterpriseStatus)
- `cancelled`: 已注销 → 视为流失
- `normal`: 工商正常
- `abnormal`: 工商异常
- `revoked`: 已吊销

### 业务状态 (businessStatus)
- `lost`: 已流失 → 视为流失
- `normal`: 正常
- `logged_out`: 已注销
- `logging_out`: 注销中
- `waiting_transfer`: 等待转出

### 流失判断逻辑
```typescript
const isChurned = (enterpriseStatus === 'cancelled' || businessStatus === 'lost');
```

## 性能优化

### 1. 数据库索引
- 复合索引优化时间点查询性能
- 状态字段索引支持快速过滤
- 企业名称和信用代码索引支持模糊查询

### 2. 查询优化
- 使用子查询减少数据传输量
- 权限过滤在应用层进行，避免复杂JOIN
- 支持回退查询机制，确保系统稳定性

### 3. 缓存机制
- 集成报表缓存系统
- 支持用户级和全局缓存
- 2小时缓存时间平衡性能和实时性

## 部署说明

### 1. 数据库迁移
```bash
# 执行数据库迁移脚本
mysql -u username -p database_name < src/migrations/003_create_customer_status_history.sql
```

### 2. 模块注册
客户状态历史模块已自动集成到报表模块中，无需额外配置。

### 3. 权限配置
确保用户具有相应的报表查看权限：
- `customer_churn_stats`: 客户流失统计权限
- `reports_view`: 报表查看基础权限

## 使用示例

### 客户流失统计查询
```bash
# 查询2024年的客户流失情况
GET /api/reports/customer-churn-stats?year=2024

# 查询2024年6月的客户流失情况
GET /api/reports/customer-churn-stats?year=2024&month=6

# 查询当前月份的客户流失情况
GET /api/reports/customer-churn-stats
```

### 历史状态查询
```bash
# 查询客户在2024年6月30日的状态
GET /api/reports/customer-status-history/status-at-time?customerId=123&targetDate=2024-06-30

# 批量查询多个客户的历史状态
GET /api/reports/customer-status-history/batch-status-at-time?customerIds=123,456,789&targetDate=2024-06-30
```

## 技术特性

### 1. 类型安全
- 完整的TypeScript类型定义
- 严格的DTO验证
- 类型安全的数据库操作

### 2. 错误处理
- 优雅的错误降级机制
- 详细的日志记录
- 回退查询方案

### 3. 扩展性
- 模块化设计便于扩展
- 支持新增状态字段
- 灵活的查询条件组合

### 4. 一致性
- 与现有报表模块保持一致的API设计
- 统一的权限控制机制
- 相同的缓存和性能优化策略

这个实现完全符合您的需求，将客户流失统计与客户等级分布统计采用相同的处理方式，基于专门的状态历史表实现精确的时间点状态还原和流失分析。 