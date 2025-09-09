# 薪资提成字段自动生成逻辑优化

## 📋 修改概述

优化了自动生成薪资接口的逻辑，确保提成字段的计算更加准确和可靠。

## 🔄 修改内容

### 1. 新增方法：`clearExpenseCommissionFields`

**位置**：`src/modules/salary/services/salary-auto-update.service.ts`

**功能**：清空指定日期范围内费用记录的提成字段

**清空字段**：
- `business_commission` - 总业务提成
- `business_commission_own` - 自营业务提成  
- `business_commission_outsource` - 外包业务提成
- `agency_commission` - 代理费提成

### 2. 修改方法：`generateMonthlySalaries`

**新增逻辑**：在处理员工薪资数据之前，先执行清空操作

**执行顺序**：
1. ✅ 检查时间限制
2. ✅ 检查和更新记账会计绩效扣除
3. 🆕 **清空费用记录的提成字段**
4. ✅ 获取员工数据
5. ✅ 计算并填充新的提成数据

## 🎯 优化效果

### 原有问题
- 提成字段可能存在脏数据
- 重新计算时可能基于错误的基础数据
- 数据一致性无法保证

### 优化后
- ✅ **数据清洁**：每次重新计算前先清空相关字段
- ✅ **准确计算**：基于清洁的数据进行重新计算
- ✅ **一致性保证**：确保所有提成字段都是最新计算结果
- ✅ **可追溯性**：通过日志记录清空和计算过程

## 📝 SQL 操作示例

```sql
-- 清空操作
UPDATE sys_expense 
SET 
  business_commission = 0,
  business_commission_own = 0,
  business_commission_outsource = 0,
  agency_commission = 0
WHERE 
  createdAt BETWEEN '2024-01-01' AND '2024-01-31' AND
  status = 1;
```

## 🔍 日志追踪

系统会记录以下关键操作：
- 清空操作的影响行数
- 每个员工的提成计算过程
- 错误信息和异常处理

## ⚠️ 注意事项

1. **数据备份**：建议在执行自动生成前备份重要数据
2. **权限控制**：仅限 `salary_admin` 和 `super_admin` 角色使用
3. **时间限制**：不能生成2025年6月及其之前的薪资数据
4. **状态过滤**：只处理 `status = 1` 的已审核费用记录

## 🚀 使用方法

### API 调用
```http
POST /salary/auto-generate?month=2024-07-01
Authorization: Bearer <token>
```

### 响应示例
```json
{
  "success": true,
  "message": "薪资数据生成成功，共更新5条记录，新增10条记录",
  "details": {
    "updated": 5,
    "created": 10
  }
}
```

---
**修改时间**：2024年当前时间  
**修改人员**：系统开发团队  
**版本**：v1.1.0 