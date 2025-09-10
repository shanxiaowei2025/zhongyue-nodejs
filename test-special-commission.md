# 特殊业务提成功能测试文档

## 功能概述
第三种业务提成计算方式：特殊业务提成，需要手动输入提成金额。

## 新增字段
1. **otherBusinessSpecial**: 其他业务(特殊) - JSON数组格式
2. **otherBusinessSpecialFee**: 其他业务费用(特殊) - DECIMAL(10,2)
3. **specialBusinessCommission**: 特殊业务提成金额 - DECIMAL(10,2)

## API接口

### 1. 查询特殊业务费用记录列表
- **路径**: `GET /expense/special`
- **说明**: 查询有特殊业务的费用记录
- **参数**:
  - `page`: 页码 (可选)
  - `pageSize`: 每页数量 (可选)
  - `salesperson`: 业务员 (可选)
  - `startDate`: 开始日期 (可选)
  - `endDate`: 结束日期 (可选)
  - `companyName`: 企业名称 (可选)

### 2. 更新特殊业务提成金额
- **路径**: `PATCH /expense/:id/special-commission`
- **说明**: 修改指定费用记录的特殊业务提成金额
- **参数**:
  - `specialBusinessCommission`: 特殊业务提成金额

### 3. 更新特殊业务信息和费用
- **路径**: `PATCH /expense/:id/special-fee`
- **说明**: 修改指定费用记录的特殊业务相关信息
- **参数**:
  - `otherBusinessSpecial`: 其他业务(特殊) - 可选
  - `otherBusinessSpecialFee`: 其他业务费用(特殊) - 可选
  - `specialBusinessCommission`: 特殊业务提成金额 - 可选

## 薪资计算逻辑更新

### 计算范围扩展
原有查询条件：
```sql
WHERE salesperson = ? AND 
      (businessType = '新增' OR businessType IS NULL OR businessType = '') AND 
      status = 1 AND chargeDate BETWEEN ? AND ?
```

新查询条件：
```sql
WHERE salesperson = ? AND 
      (
        (businessType = '新增' OR businessType IS NULL OR businessType = '') OR
        (specialBusinessCommission IS NOT NULL AND specialBusinessCommission > 0)
      ) AND 
      status = 1 AND chargeDate BETWEEN ? AND ?
```

### 提成计算增强
在所有业务提成计算分支中都增加了特殊业务提成：
```typescript
// 计算特殊业务提成（直接使用手工设置的金额）
const specialCommission = Number(expense.specialBusinessCommission || 0);

// 计算总业务提成
const totalBusinessCommission = 
  basicBusinessCommission + outsourceBusinessCommission + specialCommission;
```

## 测试用例

### 测试用例1: 查询特殊业务费用记录
```bash
curl -X GET "http://localhost:3000/expense/special?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 测试用例2: 设置特殊业务提成
```bash
curl -X PATCH "http://localhost:3000/expense/123/special-commission" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "specialBusinessCommission": 500.00
  }'
```

### 测试用例2.1: 更新特殊业务信息和费用
```bash
curl -X PATCH "http://localhost:3000/expense/123/special-fee" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "otherBusinessSpecial": ["特殊咨询服务", "特殊代理业务"],
    "otherBusinessSpecialFee": 3000.00,
    "specialBusinessCommission": 600.00
  }'
```

### 测试用例3: 创建包含特殊业务的费用记录
```bash
curl -X POST "http://localhost:3000/expense" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyName": "测试企业",
    "salesperson": "张三",
    "businessType": "新增",
    "otherBusinessSpecial": ["特殊服务A", "特殊服务B"],
    "otherBusinessSpecialFee": 2000.00,
    "specialBusinessCommission": 300.00,
    "chargeDate": "2024-12-01"
  }'
```

## 验证要点

1. **数据库字段**: 确认新字段已成功添加到sys_expense表
   - `otherBusinessSpecial`: JSON类型
   - `otherBusinessSpecialFee`: DECIMAL(10,2)类型  
   - `specialBusinessCommission`: DECIMAL(10,2)类型
2. **接口功能**: 测试查询和更新特殊业务的所有接口
   - 查询特殊业务费用记录列表
   - 更新特殊业务提成金额
   - 更新特殊业务信息和费用
3. **薪资计算**: 验证特殊业务提成是否正确计入总业务提成
4. **权限控制**: 确认只有有权限的用户可以修改特殊业务信息
5. **数据验证**: 测试所有字段的有效性验证
6. **查询逻辑**: 验证特殊业务记录的筛选条件是否正确
   - 有特殊业务内容的记录
   - 有特殊业务费用的记录
   - 有特殊业务提成的记录

## 注意事项

1. 特殊业务提成金额必须手动设置，系统不会自动计算
2. 只有设置了特殊业务提成金额且大于0的记录才会被包含在薪资计算中
3. 特殊业务提成会直接加入到总业务提成中，不受其他提成比率影响
4. 修改特殊业务提成后，需要重新运行薪资计算才能生效 