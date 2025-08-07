# 年月查询功能测试指南

## 问题背景
修复前，部分薪资模块（如补贴合计、朋友圈扣款、考勤扣款）在使用 `yearMonth=2025-06` 格式参数查询时返回空数据，而社保信息模块可以正常工作。

## 修复内容
统一所有薪资模块的年月查询逻辑，使用 `DATE_FORMAT(field, "%Y-%m") LIKE "%YYYY-MM%"` 进行模糊查询。

## 测试接口列表

### 1. 社保信息查询（修复前已正常）
**接口**: `GET /api/social-insurance?yearMonth=2025-06`
**预期**: 返回2025年6月的所有社保信息记录

### 2. 补贴合计查询（已修复）
**接口**: `GET /api/subsidy-summary?yearMonth=2025-06`
**预期**: 返回2025年6月的所有补贴合计记录

### 3. 朋友圈扣款查询（已修复）
**接口**: `GET /api/friend-circle-payment?yearMonth=2025-06`
**预期**: 返回2025年6月的所有朋友圈扣款记录

### 4. 考勤扣款查询（已修复）
**接口**: `GET /api/attendance-deduction?yearMonth=2025-06`
**预期**: 返回2025年6月的所有考勤扣款记录

### 5. 保证金查询（无需修复）
**接口**: `GET /api/deposit?startDate=2025-06-01&endDate=2025-06-30`
**说明**: 保证金模块使用日期范围查询，字段为 `deductionDate`，不受此问题影响

## 测试步骤

### 准备工作
1. 确保数据库中有2025年6月的测试数据
2. 获取有效的JWT认证token
3. 确保用户具有 `salary_admin` 或 `super_admin` 权限

### 测试用例

#### 测试用例1：年月格式兼容性
测试不同的年月格式是否都能正常工作：

```bash
# 格式1：YYYY-MM
GET /api/subsidy-summary?yearMonth=2025-06

# 格式2：YYYY-MM-DD（应该提取年月部分）
GET /api/subsidy-summary?yearMonth=2025-06-15
```

#### 测试用例2：跨模块一致性
确保所有模块对相同年月参数返回一致的行为：

```bash
# 所有这些接口应该都返回2025年6月的数据
GET /api/social-insurance?yearMonth=2025-06
GET /api/subsidy-summary?yearMonth=2025-06
GET /api/friend-circle-payment?yearMonth=2025-06
GET /api/attendance-deduction?yearMonth=2025-06
```

#### 测试用例3：空数据处理
测试不存在数据的年月：

```bash
# 应该返回空数组，而不是错误
GET /api/subsidy-summary?yearMonth=2030-12
```

## 验证要点

### 成功标准
1. **返回数据**: 所有接口都应该返回正确的2025年6月数据
2. **数据结构**: 返回格式应该一致：
   ```json
   {
     "data": [...],
     "total": 数量,
     "page": 1,
     "pageSize": 10,
     "code": 0,
     "message": "操作成功"
   }
   ```
3. **性能**: 查询响应时间应该在合理范围内（< 1秒）

### 失败症状
- 返回空数组 `"data": []` 且 `"total": 0`
- 返回HTTP错误状态码
- 查询超时或性能问题

## 技术细节

### 修复前后对比

**修复前（问题代码）**:
```typescript
// 精确匹配，无法处理YYYY-MM格式
queryBuilder.andWhere('subsidySummary.yearMonth = :yearMonth', { yearMonth: safeYearMonth });
```

**修复后（正确代码）**:
```typescript
// 模糊匹配，提取年月部分进行查询
const yearMonthPart = yearMonthStr.substring(0, 7); // "2025-06"
queryBuilder.andWhere('DATE_FORMAT(subsidySummary.yearMonth, "%Y-%m") LIKE :yearMonth', 
  { yearMonth: `%${yearMonthPart}%` });
```

### SQL查询示例
修复后生成的SQL查询类似于：
```sql
SELECT * FROM sys_subsidy_summary 
WHERE DATE_FORMAT(yearMonth, "%Y-%m") LIKE "%2025-06%"
```

## 常见问题

### Q: 为什么使用LIKE而不是精确匹配？
A: 因为前端传递的是 `"2025-06"` 格式，而数据库存储的是完整日期如 `"2025-06-01"`，使用LIKE可以匹配年月部分。

### Q: 会不会影响查询性能？
A: 使用DATE_FORMAT函数可能略微影响性能，但由于薪资数据量不大，实际影响微乎其微。

### Q: 其他日期查询是否受影响？
A: 不受影响。startDate和endDate参数的处理逻辑保持不变。

## 回归测试建议
在部署此修复后，建议执行以下回归测试：
1. 验证所有现有的薪资查询功能正常
2. 确认分页功能未受影响  
3. 检查日期范围查询（startDate/endDate）仍然正常
4. 验证其他筛选条件（姓名、部门等）与年月查询的组合使用 