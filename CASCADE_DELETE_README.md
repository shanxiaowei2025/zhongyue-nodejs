# 员工删除级联删除薪资数据功能

## 功能概述

当删除员工信息时，系统会自动删除该员工的所有相关薪资数据，确保数据的一致性和完整性。

## 实现方案

采用在业务逻辑层面实现级联删除的方案，通过员工服务调用薪资服务来删除相关数据。

### 涉及的数据表

删除员工时，系统会自动删除以下数据表中与该员工相关的记录：

1. **sys_salary** - 薪资主表
2. **sys_social_insurance** - 社保信息表
3. **sys_subsidy_summary** - 补贴合计表
4. **sys_attendance_deduction** - 考勤扣款表
5. **sys_friend_circle_payment** - 朋友圈扣款表
6. **sys_deposit** - 保证金记录表
7. **sys_salary_base_history** - 薪资基数历史表

### 关联字段

- 大部分表通过 `name` 字段与员工姓名关联
- 薪资基数历史表通过 `employeeName` 字段关联

## 技术实现

### 1. 薪资服务扩展

在 `SalaryService` 中新增了以下方法：

#### `removeByEmployeeName(employeeName: string)`
- 删除指定员工的主薪资记录
- 返回删除的记录数量

#### `removeAllSalaryDataByEmployeeName(employeeName: string)`
- 删除指定员工的所有薪资相关数据
- 使用数据库事务确保数据一致性
- 返回详细的删除统计信息

```typescript
interface DeletionResult {
  totalDeleted: number;
  details: {
    salaryRecords: number;
    socialInsurance: number;
    subsidySummary: number;
    attendanceDeduction: number;
    friendCirclePayment: number;
    deposit: number;
    salaryBaseHistory: number;
  };
}
```

### 2. 员工服务更新

在 `EmployeeService` 的 `remove` 方法中：

1. 首先调用薪资服务删除所有相关薪资数据
2. 记录详细的删除日志
3. 然后删除员工记录

### 3. 模块依赖配置

- 在 `EmployeeModule` 中导入了 `SalaryModule`
- 在 `SalaryModule` 中注册了所有相关的实体Repository

## 使用示例

```typescript
// 删除员工，会自动级联删除薪资数据
await employeeService.remove(employeeId);
```

## 删除日志示例

```
开始删除员工: 123 (张三)
已删除员工 "张三" 的薪资相关数据，总计 15 条记录:
  - 薪资记录: 12 条
  - 社保信息: 1 条
  - 补贴合计: 1 条
  - 考勤扣款: 1 条
  - 朋友圈扣款: 0 条
  - 保证金记录: 0 条
  - 薪资基数历史: 0 条
员工记录删除完成: 123 (张三)
```

## 错误处理

### 事务保护
- 使用数据库事务确保所有薪资数据的删除操作要么全部成功，要么全部回滚
- 如果薪资数据删除失败，可以选择是否中断整个员工删除流程

### 错误恢复策略
默认情况下，如果薪资数据删除失败，系统会记录错误日志但继续删除员工记录。
如果需要薪资数据删除失败时中断整个删除流程，可以在员工服务中取消注释以下代码：

```typescript
// throw error; // 如果希望薪资数据删除失败时中断整个删除流程，取消注释这行
```

## 性能考虑

1. **批量查询优化**：每个表使用单次查询获取所有相关记录
2. **事务管理**：使用数据库事务确保操作的原子性
3. **日志记录**：提供详细的操作日志便于问题排查

## 安全性

1. **权限校验**：员工删除操作继承原有的权限校验机制
2. **数据完整性**：通过事务确保数据删除的完整性
3. **审计日志**：记录详细的删除操作日志

## 注意事项

1. **不可逆操作**：员工删除是不可逆的，删除后无法恢复
2. **数据备份**：建议在执行删除操作前做好数据备份
3. **关联检查**：确保没有其他业务数据依赖于要删除的员工
4. **测试验证**：在生产环境使用前，请在测试环境充分验证功能

## 扩展说明

如果将来需要添加新的薪资相关数据表，只需要：

1. 在 `SalaryService.removeAllSalaryDataByEmployeeName` 方法中添加对新表的删除逻辑
2. 在 `SalaryModule` 中注册新的实体
3. 在薪资服务构造函数中注入新的Repository

这样可以确保新的薪资相关数据也会在员工删除时被自动清理。 