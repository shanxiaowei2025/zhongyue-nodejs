# 业务提成和代理费提成时间范围修改

## 📋 修改概述

将业务提成和代理费提成的计算时间范围从"上个月完整月份"修改为"上个月2号到本月1号"。

## 🔄 修改内容

### 时间范围变更

**修改前**:
- 开始时间: 上个月第1天 (`lastMonth.startOf('month')`)
- 结束时间: 上个月最后1天 (`lastMonth.endOf('month')`)

**修改后**:
- 开始时间: 上个月第2天 (`lastMonth.clone().date(2)`)
- 结束时间: 本月第1天 (`now.clone().date(1)`)

### 📝 修改的方法

#### 1. `generateMonthlySalaries` 方法
**位置**: `src/modules/salary/services/salary-auto-update.service.ts`

**变更**:
```typescript
// 修改前
const firstDayOfLastMonth = lastMonth.startOf('month').format('YYYY-MM-DD');
const lastDayOfLastMonth = lastMonth.endOf('month').format('YYYY-MM-DD');

// 修改后
const commissionStartDate = lastMonth.clone().date(2).format('YYYY-MM-DD'); // 上个月2号
const commissionEndDate = now.clone().date(1).format('YYYY-MM-DD'); // 本月1号
```

#### 2. `calculateBusinessCommission` 方法
**变更**:
- 参数名: `firstDayOfLastMonth, lastDayOfLastMonth` → `startDate, endDate`
- 注释更新: 反映新的时间范围逻辑
- SQL查询: 使用新的时间参数

#### 3. `calculateAgencyFeeCommission` 方法
**变更**:
- 参数名: `firstDayOfLastMonth, lastDayOfLastMonth` → `startDate, endDate`
- 注释更新: 反映新的时间范围逻辑
- SQL查询: 使用新的时间参数

#### 4. `clearExpenseCommissionFields` 方法
**变更**:
- 参数名: `firstDayOfLastMonth, lastDayOfLastMonth` → `startDate, endDate`
- 注释更新: 反映新的时间范围逻辑

#### 5. `updateExpenseAgencyCommission` 方法
**变更**:
- 参数名: `firstDayOfLastMonth, lastDayOfLastMonth` → `startDate, endDate`
- 注释更新: 反映新的时间范围逻辑

## 🎯 业务影响

### 时间范围示例
假设当前时间为 2024年8月15日：

**修改前** (上个月完整月份):
- 开始: 2024-07-01
- 结束: 2024-07-31

**修改后** (上个月2号到本月1号):
- 开始: 2024-07-02  
- 结束: 2024-08-01

### 影响范围
1. **业务提成计算**: 基于新时间范围筛选 `sys_expense` 表中的记录
2. **代理费提成计算**: 基于新时间范围筛选费用记录
3. **数据清理**: 清空操作也使用新的时间范围
4. **薪资生成**: 所有相关的薪资计算都使用新的时间范围

## ⚠️ 注意事项

1. **数据一致性**: 确保所有提成相关的计算都使用统一的时间范围
2. **边界情况**: 注意处理月初月末的边界情况
3. **历史数据**: 此修改不影响已生成的历史薪资数据
4. **测试验证**: 建议在测试环境充分验证新的时间范围逻辑

## 📊 SQL查询示例

```sql
-- 业务提成查询 (修改后)
SELECT * FROM sys_expense 
WHERE 
  salesperson = '张三' AND 
  (businessType = '新增' OR businessType IS NULL OR businessType = '') AND 
  status = 1 AND
  createdAt BETWEEN '2024-07-02' AND '2024-08-01';

-- 代理费提成查询 (修改后)
SELECT 
  SUM(agencyFee) as totalAgencyFee,
  SUM(CASE WHEN socialInsuranceBusinessType = '续费' THEN socialInsuranceAgencyFee ELSE 0 END) as totalSocialInsuranceAgencyFee,
  SUM(accountingSoftwareFee) as totalAccountingSoftwareFee,
  SUM(invoiceSoftwareFee) as totalInvoiceSoftwareFee,
  SUM(addressFee) as totalAddressFee
FROM sys_expense 
WHERE 
  salesperson = '张三' AND 
  createdAt BETWEEN '2024-07-02' AND '2024-08-01' AND
  status = 1;
```

---
**修改时间**: 2024年当前时间  
**修改人员**: 系统开发团队  
**版本**: v1.2.0 