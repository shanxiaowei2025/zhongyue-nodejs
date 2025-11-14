# 中岳信息管理系统后端

## 项目概述

本项目是基于NestJS框架构建的信息管理系统后端，采用模块化设计，支持多个前端项目对接，包括React信息管理系统等。系统使用TypeScript开发，采用Docker进行开发和生产环境部署。

## 技术栈

- **框架**: NestJS (基于Node.js的企业级框架)
- **语言**: TypeScript
- **数据库**: MySQL
- **ORM**: TypeORM
- **认证**: JWT (JSON Web Token)
- **存储**: MinIO (对象存储)
- **部署**: Docker (开发和生产环境)
- **API文档**: Swagger

## 项目架构

项目采用了NestJS推荐的模块化架构设计，清晰分离各个业务领域，便于维护和扩展。

### 主要项目结构

```
src/
├── app.module.ts          # 主模块，集成所有子模块
├── main.ts                # 入口文件，应用初始化配置
├── common/                # 通用模块
│   ├── constants/         # 常量定义
│   ├── decorators/        # 自定义装饰器
│   ├── filters/           # 异常过滤器
│   ├── guards/            # 守卫
│   ├── interceptors/      # 拦截器
│   ├── interfaces/        # 接口定义
│   ├── middleware/        # 中间件
│   └── utils/             # 工具函数
├── config/                # 配置模块
│   ├── app.config.ts      # 应用配置
│   ├── database.config.ts # 数据库配置
│   ├── storage.config.ts  # 存储配置
│   └── jwt.config.ts      # JWT配置
├── modules/               # 业务模块
│   ├── auth/              # 认证模块
│   ├── users/             # 用户管理
│   ├── department/        # 部门管理
│   ├── customer/          # 客户管理
│   ├── contract/          # 合同管理
│   ├── expense/           # 费用管理
│   ├── storage/           # 文件存储
│   ├── roles/             # 角色管理
│   ├── permissions/       # 权限管理
│   ├── notifications/     # 通知系统
│   ├── reports/           # 报表分析
│   ├── groups/            # 群组管理
│   └── business-options/  # 业务选项管理（新增）
└── database/              # 数据库相关
    └── migrations/        # 数据库迁移文件
```

## 核心功能模块

### 1. 认证模块 (auth)
- 用户登录、注册功能
- JWT令牌认证
- 合同令牌认证系统（用于未登录用户访问特定资源）
- 角色权限控制（RBAC）

### 2. 用户管理模块 (users)
- 用户CRUD操作
- 用户角色分配
- 部门关联

### 3. 客户管理模块 (customer)
- 客户信息的CRUD操作
- 客户分类和标签
- 费用贡献金额跟踪
- 客户档案信息查询：支持按企业名称或统一社会信用代码筛选
- **宗族管理功能**：
  - 宗族信息的CRUD操作（创建、查询、更新、删除）
  - 支持宗族名称、成员列表、创建人、备注等字段管理
  - 支持按宗族名称进行模糊查询和精确匹配
  - 支持按成员姓名进行模糊查询
  - 分页查询功能，默认每页10条记录
  - 统一查询接口，支持通过参数控制返回格式
  - 完整的Swagger API文档支持

### 企业服务模块 (enterprise-service)
- 客户列表查询：支持按费用贡献金额倒序排列
- 客户详情查询
- 费用贡献分析：
  - 支持按企业名称或统一社会信用代码筛选
  - 支持按年份筛选费用记录（通过year参数传入年份，如2024）
  - 返回指定年份的费用明细和总金额统计
- 服务历程跟踪

### 4. 部门管理模块 (department)
- 部门信息的CRUD操作
- 组织架构管理

### 5. 费用管理模块 (expense)
- 费用记录的CRUD操作
- 费用统计和报表
- 费用审核流程管理
- 客户费用贡献金额自动计算

#### 重要业务流程
- **费用删除保护机制**: 已审核通过的费用记录不能直接删除，必须先取消审核
- **贡献金额同步**: 费用审核通过时自动累加客户贡献金额，取消审核时自动扣减
- **前后端双重保护**: 前端UI控制删除按钮显示，后端API验证记录状态

### 6. 合同管理模块 (contract)
- 合同信息管理
- 合同状态跟踪
- 合同签署功能
- 合同令牌系统：生成临时访问令牌用于未登录用户访问合同
- **归属地管理**：支持为合同设置归属地，并基于归属地进行权限控制和数据查询

### 7. 文件存储模块 (storage)
- 文件上传、下载、删除
- 支持JWT认证和合同令牌认证
- 基于MinIO的对象存储

### 8. 角色和权限模块 (roles, permissions)
- 基于RBAC的权限控制系统
- 角色管理
- 权限分配

### 9. 通知系统模块 (notifications)
- 实时通知推送和管理
- 支持多种接收范围：指定用户ID、指定用户名、角色、部门
- **用户名指定功能**：支持通过用户名（`targetUserNames`）直接指定通知接收者，系统自动查找对应用户ID
- 支持多端用户连接（浏览器、移动端），同一用户的全部活跃连接都会收到推送
- 通知状态：未读/已读
- 与业务模块集成（费用审批、合同签署、薪资等）
- **定时数据清理**：每天凌晨3点自动清理半年前的通知数据，确保数据库性能

#### 数据库表
- `sys_notification`：通知主表（id、title、content、type、createdBy、createdAt）
- `sys_notification_recipient`：通知接收表（id、notificationId、userId、readStatus、readAt、createdAt）

##### 建表 SQL（MySQL）
```sql
CREATE TABLE `sys_notification` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `title` varchar(255) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `type` varchar(50) NOT NULL DEFAULT 'system' COMMENT '通知类型（自由字符串）',
  `createdBy` bigint NOT NULL COMMENT '创建者用户ID',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_sys_notification_createdBy` (`createdBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知主表';
```

```sql
CREATE TABLE `sys_notification_recipient` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `notificationId` bigint NOT NULL COMMENT '通知ID',
  `userId` bigint NOT NULL COMMENT '接收用户ID',
  `readStatus` tinyint NOT NULL DEFAULT 0 COMMENT '已读状态：0未读，1已读',
  `readAt` datetime NULL DEFAULT NULL COMMENT '阅读时间',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_sys_notification_recipient_notificationId` (`notificationId`),
  KEY `idx_sys_notification_recipient_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知接收表';
```

> 说明：通知类型字段采用自由字符串，前端可自定义；当前未添加外键约束，可按需补充。

#### REST API
- `POST /api/notifications`：创建通知（支持 `targetUsers`、`targetUserNames`、`targetRoles`、`targetDepts`）
- `GET /api/notifications`：获取我的通知（分页，支持 `onlyNew=true`）
- `GET /api/notifications/new`：仅未读通知
- `DELETE /api/notifications/:id`：删除通知（后续可扩展权限校验）

#### 创建通知请求示例
```json
{
  "title": "通知测试",
  "content": "给指定用户名的用户发送通知",
  "type": "system",
  "targetUserNames": ["张三", "李四", "王五"]
}
```

#### WebSocket
- 命名空间：`/ws`
- 连接参数：在 `auth` 或 `query` 中传 `token`
- 事件：`new-notification`（服务器推送新通知）
- 客户端示例：
```ts
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000/ws', { auth: { token: localStorage.getItem('token') }});
socket.on('new-notification', (data) => { console.log('收到新通知:', data); });
```

#### 定时任务
- **数据清理任务**：每天凌晨3点执行 (`@Cron('0 3 * * *')`)
- **清理策略**：删除创建时间超过6个月的通知记录和对应的接收者记录
- **实现机制**：使用数据库级别的CASCADE删除确保数据一致性
- **日志记录**：清理过程中记录详细的统计信息和错误日志

### 10. 凭证存放记录模块 (voucher-record)
- 支持年度凭证记录和月度凭证记录的完整CRUD操作
- 年度记录管理：创建、查询、更新、删除年度凭证记录
- 月度记录管理：支持12个月的凭证状态跟踪和批量更新
- 统计功能：提供年度记录的月度统计信息
- 导出功能：支持导出凭证记录为Excel文件
- **权限控制系统**：
  - `voucher_record_action_view`：查看凭证存放记录权限
  - `voucher_record_action_create`：创建凭证存放记录权限
  - `voucher_record_action_edit`：编辑凭证存放记录权限
  - `voucher_record_action_delete`：删除凭证存放记录权限
  - `voucher_record_action_export`：导出凭证存放记录权限
- **状态管理灵活性**：月度记录的状态字段为字符串类型，完全由前端定义状态内容
- **客户关联查询**：支持根据客户ID查询其所有年度凭证记录

### 11. 薪资管理模块 (salary)
- 薪资信息的CRUD操作
- 薪资基数历程管理（仅限管理员和超级管理员）
- ~~薪资自动生成功能~~ **已取消定时任务**：原每月13号自动生成薪资的功能已禁用，保留手动生成功能
- **薪资生成时间限制**：不能生成2025年6月及其之前的薪资数据，防止误操作
- 各种薪资相关组件（社保、补贴、考勤扣款等）
- 提成表管理（仅限管理员和超级管理员）
- **薪资二级密码保护**：员工查看个人薪资需要设置并验证二级密码，提供额外安全保护
- **数据导入覆盖功能**：支持基于姓名和年月(YYYY-MM)的重复数据覆盖导入
  - 社保信息导入：`POST /api/social-insurance/import`
  - 补贴合计导入：`POST /api/subsidy-summary/import`
  - 朋友圈扣款导入：`POST /api/friend-circle-payment/import`
  - 考勤扣款导入：`POST /api/attendance-deduction/import`（已增强员工姓名对比功能）
  - 保证金导入：`POST /api/deposit/upload`
- **年月查询统一优化**：所有薪资模块支持 `yearMonth=2025-06` 格式的年月查询参数
- **薪资更新接口修复**：修复更新薪资记录时动态字段（`payrollCompany`、`depositTotal`）导致的数据库字段冲突问题
- **薪资DTO优化**：从 `UpdateSalaryDto` 中移除自动计算字段（`basicSalaryPayable`、`totalPayable`、`corporatePayment`、`taxDeclaration`），确保只有业务输入字段可以被修改，系统自动维护所有计算字段
- **薪资查询修复**：修复删除数据库中 `company` 字段后，代码中仍使用该字段查询导致的查询失败问题。已将相关代码注释并改用员工表中的 `payrollCompany` 字段
- **薪资自动更新修复**：修复 `salary-auto-update.service.ts` 中对已删除 `company` 字段的引用，消除TypeScript编译错误
- **员工状态同步功能**：新增员工从离职状态改为在职状态时，自动启用对应用户账号的功能，与原有的离职禁用用户账号功能形成完整闭环
- **薪资接口考勤备注功能**：为四个薪资接口（管理员列表、员工列表、管理员详情、员工详情）添加 `attendanceRemark` 字段，通过姓名和年月从 `sys_attendance_deduction` 表获取考勤备注信息

### 11. 群组管理模块 (groups)
- 企业微信群组信息管理
- 群成员信息跟踪（员工和客户）
- 群消息监控和记录
- 群提醒级别管理
- 支持群组的CRUD操作
- **数据库表结构**：
  - `groups`：群组主表
    - `id`：自增主键ID
    - `chatId`：企业微信群聊唯一标识符
    - `name`：群聊名称
    - `owner`：群主企业微信用户ID
    - `members`：群成员信息（JSON格式，包含成员ID、类型、姓名等）
    - `lastMessage`：群内最后一条消息记录（JSON格式）
    - `lastEmployeeMessage`：员工发送的最后一条消息记录（JSON格式）
    - `lastCustomerMessage`：客户发送的最后一条消息记录（JSON格式）
    - `needAlert`：是否需要发送提醒（0-不需要，1-需要）
    - `alertLevel`：提醒级别（数字越大级别越高）
    - `createdAt`：记录创建时间（自动时间戳）
    - `updatedAt`：记录最后更新时间（自动更新时间戳）

### 12. 报表分析模块 (reports)
- **数据分析与报表功能**：提供多维度的业务数据分析和统计报表
- **智能缓存系统**：使用基于权限的缓存机制提升报表查询性能，支持用户级和全局缓存
- **角色变更缓存处理**：当用户角色发生变更时，自动清除相关缓存确保数据准确性
- **Excel导出功能**：支持将报表数据导出为Excel格式，便于数据分析和存档
- **多种报表类型**：
  - 代理费收费变化分析：分析代理记账费用的时间趋势变化
  - 新增客户统计：统计指定时间段内的新增客户数量和趋势
  - 员工业绩统计：分析业务员的销售业绩和贡献度
  - 客户等级分布统计：分析客户等级的分布情况
  - 客户流失统计：识别和分析客户流失情况
  - 代理服务到期客户统计：基于年月比较筛选出代理服务已到期的客户（当前年月大于代理结束日期年月）
  - 会计负责客户数量统计：统计各会计负责的客户数量分布
- **权限控制**：报表数据基于费用数据权限进行过滤，确保用户只能查看有权限访问的数据
- **数据库优化**：为报表查询添加专门的数据库索引，提升查询性能

#### 缓存机制说明
报表模块采用了基于权限的智能缓存机制：

1. **权限感知缓存**：缓存键包含用户权限信息，确保不同权限的用户获取不同的缓存数据
2. **角色变更处理**：当用户角色发生变更时，系统提供专门的接口清除相关缓存
3. **自动过期机制**：缓存默认有效期30分钟，系统每天凌晨2点自动清理过期缓存
4. **Upsert优化**：修复了缓存存储机制，使用先查询再更新的方式，避免唯一约束冲突
5. **数据库表结构**：提供了完整的缓存表创建脚本，确保系统正常运行

#### 缓存表创建
在首次部署时，需要执行以下SQL脚本创建缓存表：

```bash
mysql -u username -p database_name < database/create_report_cache_table.sql
```

#### 角色变更缓存清理
当用户角色发生变更时，需要调用以下接口清除缓存：

```bash
# 清除指定用户的所有报表缓存
DELETE /api/reports/clear-cache/{userId}

# 清除用户角色变更相关的缓存（推荐）
DELETE /api/reports/clear-role-change-cache/{userId}
```

**使用场景**：
- 用户从普通员工升级为管理员
- 用户从管理员降级为普通员工
- 用户的部门或权限发生变更
- 批量角色调整后需要确保数据准确性

### 角色变更缓存处理解决方案

系统已实现了完整的角色变更缓存处理机制，确保用户角色发生变更时能获取到正确的报表数据。

#### 问题背景
当用户角色发生变更时（如从普通用户升级为管理员，或从管理员降级为普通用户），由于报表缓存机制的存在，用户可能仍然看到基于旧角色权限的缓存数据，而不是基于新角色权限的正确数据。

#### 解决方案

1. **权限感知缓存键**：
   - 缓存键现在包含完整的用户权限信息（权限列表、管理员标识、角色信息）
   - 确保不同权限的用户获取不同的缓存数据
   - 当用户权限发生变更时，新的缓存键不会命中旧的缓存

2. **自动缓存清理**：
   - 用户管理模块在角色分配或更新时自动检测角色变更
   - 发现角色变更后异步调用报表缓存清理接口
   - 不阻塞主业务流程，确保系统性能

3. **手动缓存清理接口**：
   ```bash
   # 清除指定用户的所有报表缓存
   DELETE /api/reports/clear-cache/{userId}
   
   # 清除用户角色变更相关的缓存（推荐）
   DELETE /api/reports/clear-role-change-cache/{userId}
   ```

#### 技术实现细节

1. **缓存键生成优化**：
   ```typescript
   const cacheKey = this.cacheService.generateCacheKey({
     ...query,
     userId: userId, // 始终使用具体的用户ID
     permissions: userPermissions.sort(), // 添加权限信息到缓存键
     isAdmin: isAdmin, // 添加管理员标识
     userRoles: userRoles.sort() // 添加角色信息
   });
   ```

2. **用户服务集成**：
   - `assignRolesToUser()` 方法：角色分配时自动检测变更并清理缓存
   - `update()` 方法：用户信息更新时检测角色变更并清理缓存
   - 异步处理：缓存清理不影响主业务流程

3. **缓存清理策略**：
   - 清除目标用户的所有报表缓存
   - 清除可能包含管理员数据的通用缓存
   - 支持批量用户缓存清理

#### 使用建议

1. **角色变更后的验证**：
   - 角色变更后，建议用户重新登录或刷新页面
   - 系统会自动使用新的权限获取正确的报表数据

2. **批量角色调整**：
   - 进行批量角色调整时，系统会自动处理每个用户的缓存清理
   - 如需手动清理，可调用批量清理接口

3. **监控和日志**：
   - 所有缓存清理操作都有详细的日志记录
   - 可通过日志监控缓存清理的执行情况

#### 注意事项

1. **缓存清理是异步的**：不会阻塞用户角色变更的主流程
2. **网络依赖**：缓存清理通过HTTP请求实现，确保服务间通信正常
3. **降级处理**：如果缓存清理失败，不会影响角色变更操作，只会记录错误日志

这个解决方案确保了用户角色变更后能够获取到正确的报表数据，同时保持了系统的性能和稳定性。

## 权限控制

系统采用基于角色的访问控制（RBAC）和基于权限的访问控制相结合的方式：

### 角色控制
- `super_admin`：超级管理员，拥有所有权限
- `admin`：管理员，拥有大部分管理权限
- 其他自定义角色：根据业务需求配置权限

### 权限控制
- 薪资管理模块：
  - `salary_action_create`：创建薪资记录权限
  - `salary_action_edit`：编辑薪资记录权限
  - `salary_action_delete`：删除薪资记录权限
  - `salary_date_view_all`：查看所有薪资记录权限
  - `salary_date_view_by_location`：按区域查看薪资记录权限
  - `salary_date_view_own`：查看自己薪资记录权限

- 凭证存放记录管理模块：
  - `voucher_record_action_view`：查看凭证存放记录权限
  - `voucher_record_action_create`：创建凭证存放记录权限
  - `voucher_record_action_edit`：编辑凭证存放记录权限
  - `voucher_record_action_delete`：删除凭证存放记录权限
  - `voucher_record_action_export`：导出凭证存放记录权限
  
- 特殊模块权限：
  - 薪资基数历程：仅限`admin`和`super_admin`角色访问
  - 社保信息管理：仅限`admin`和`super_admin`角色访问
  - 补贴合计管理：仅限`admin`和`super_admin`角色访问
  - 考勤扣款管理：仅限`admin`和`super_admin`角色访问
  - 朋友圈扣款管理：仅限`admin`和`super_admin`角色访问
  - 提成表管理：仅限`admin`和`super_admin`角色访问（除提成比例查询接口外）

- 报表模块权限：
  - **权限控制基于费用数据权限**：报表数据的访问范围基于用户的费用数据查看权限，确保用户只能看到有权限访问的数据
  - 特定报表权限：`reports_view`、`reports_export`、各报表类型权限（`reports_agency_fee_analysis`、`reports_new_customer_stats`、`reports_employee_performance`等）用于控制用户是否可以访问报表功能

- 费用数据查看权限（适用于报表分析）：
  - `expense_data_view_all`：查看所有费用数据权限
  - `expense_data_view_by_location`：按区域查看费用数据权限（基于用户部门）
  - `expense_data_view_own`：查看自己提交的费用数据权限（基于销售人员字段）

## API路由说明

### 重要路由变更
- 社保信息模块：从 `/api/salary/social-insurance` 变更为 `/api/social-insurance`，避免与薪资详情路由 `/api/salary/:id` 冲突
- 补贴合计模块：从 `/api/salary/subsidy-summary` 变更为 `/api/subsidy-summary`，避免与薪资详情路由 `/api/salary/:id` 冲突
- 朋友圈扣款模块：从 `/api/salary/friend-circle-payment` 变更为 `/api/friend-circle-payment`，避免与薪资详情路由 `/api/salary/:id` 冲突
- 考勤扣款模块：从 `/api/salary/attendance-deduction` 变更为 `/api/attendance-deduction`，避免与薪资详情路由 `/api/salary/:id` 冲突

### 企业服务API
- `/api/enterprise-service/customer`：获取客户列表，已优化为按费用贡献金额（contributionAmount）倒序排列
- `/api/enterprise-service/customer/:id`：获取单个客户详情

### 客户管理API
- `/api/customer/archive/search`：查询客户档案信息，支持按企业名称或统一社会信用代码筛选，返回档案相关字段（**公开接口，无需认证**）

### 宗族管理API
- `/api/customer/clan`：宗族管理的完整CRUD接口
  - `POST /api/customer/clan`：创建宗族记录
  - `GET /api/customer/clan`：查询宗族列表（支持分页和多条件筛选）
    - 支持 `namesOnly=true` 参数，只返回宗族ID和名称列表（用于下拉选择等场景）
    - 支持按宗族名称进行模糊查询和精确匹配（`exactMatch=true`时精确匹配）
    - 支持按成员姓名进行模糊查询
    - 支持分页查询（page、pageSize参数）
  - `GET /api/customer/clan/:id`：获取单个宗族详情
  - `PATCH /api/customer/clan/:id`：更新宗族信息
  - `DELETE /api/customer/clan/:id`：删除宗族记录
  - `POST /api/customer/clan/members`：添加成员到宗族（请求体包含id和memberName）
  - `DELETE /api/customer/clan/:id/members/:memberName`：从宗族中移除成员

### 报表分析API
- `/api/reports`：报表分析的完整功能接口
  - `GET /api/reports/agency-fee-analysis`：代理费收费变化分析
    - 查询参数：`year` (年份，默认当前年), `threshold` (阈值，默认500), `page`, `pageSize`
    - **权限控制**：基于三个权限控制数据访问范围：
      - `expense_data_view_all`：查看所有费用数据（无过滤条件）
      - `expense_data_view_by_location`：按区域查看，匹配 `sys_expense.companyLocation = sys_department.name`（用户所属部门名称）
      - `expense_data_view_own`：查看自己数据，匹配 `sys_expense.salesperson = sys_user.username`（用户名）
    - **统计维度**：按业务员(salesperson)统计业绩，而非按审核员统计
  - `GET /api/reports/new-customer-stats`：新增客户统计
    - 查询参数：
      - `year` (可选)：年份，如：2024
      - `month` (可选)：月份，1-12
      - `startDate` (可选)：开始日期 YYYY-MM-DD
      - `endDate` (可选)：结束日期 YYYY-MM-DD
      - `page` (可选)：页码，默认1
      - `pageSize` (可选)：每页数量，默认10
      - `sortField` (可选)：排序字段，支持 companyName、createTime、contributionAmount、customerLevel
      - `sortOrder` (可选)：排序类型，ASC或DESC
    - **筛选字段说明**：
      - `startDate`和`endDate`参数基于**客户创建时间**(`customer.createTime`)字段进行筛选
      - 统计指定时间范围内新增（创建）的客户数据
    - **参数优先级**：
      - `startDate` + `endDate`：优先使用指定的日期范围
      - `year` + `month`：统计指定年月的数据
      - `year`：统计指定年份的数据
      - 无参数：默认统计当前年份的数据
    - **权限控制**：基于客户数据权限控制数据访问范围：
      - `customer_data_view_all`：查看全部客户数据（无过滤条件）
      - `customer_data_view_by_location`：按区域查看，匹配 `customer.location = user.department.name`
      - `customer_data_view_own`：查看自己负责的客户，匹配顾问会计/记账会计/开票员身份
  - `GET /api/reports/employee-performance`：员工业绩统计
    - 查询参数：`month` (YYYY-MM格式), `employeeName` (可选), `department` (可选)
    - **权限控制**：基于费用数据权限控制数据访问范围：
      - `expense_data_view_all`：查看所有费用数据（无过滤条件）
      - `expense_data_view_by_location`：按区域查看，匹配 `sys_expense.companyLocation = sys_department.name`（用户所属部门名称）
      - `expense_data_view_own`：查看自己数据，匹配 `sys_expense.salesperson = sys_user.username`（用户名）
    - **统计逻辑**：基于用户有权限查看的费用数据统计各业务员的业绩
  - `GET /api/reports/customer-level-distribution`：客户等级分布统计
    - 查询参数：
      - `year` (可选)：年份，如：2024
      - `month` (可选)：月份，1-12
      - `level` (可选)：客户等级筛选，如：AA
      - `page`, `pageSize` (可选)：分页参数，应用到客户详情列表
      - `sortField`, `sortOrder` (可选)：排序参数
    - **统计逻辑**：
      - 只传 `year`：按年统计，统计指定年份新增的客户等级分布
      - 传 `year` + `month`：按月统计，统计指定年月新增的客户等级分布  
      - 只传 `month`：按当年该月统计，统计当前年份指定月份新增的客户等级分布
      - 都不传：按当前年月统计，统计当前年月新增的客户等级分布
    - **返回结构**：
      - `list`：客户详情列表（分页），每个客户包含等级信息
      - `levelStats`：等级统计信息（不分页），包含各等级的数量、占比、收入统计
      - `summary`：汇总信息
    - **权限控制**：基于客户数据权限控制数据访问范围：
      - `customer_data_view_all`：查看全部客户数据（无过滤条件）
      - `customer_data_view_by_location`：按区域查看，匹配 `customer.location = user.department.name`
      - `customer_data_view_own`：查看自己负责的客户，匹配顾问会计/记账会计/开票员身份
  - `GET /api/reports/customer-churn-stats`：客户流失统计（已修改）
    - 查询参数：
      - `year` (可选)：年份，如：2024
      - `month` (可选)：月份，1-12
      - `page` (可选)：页码，默认1
      - `pageSize` (可选)：每页数量，默认10
      - `sortField` (可选)：排序字段，支持 period、churnCount、churnRate、companyName、churnDate
      - `sortOrder` (可选)：排序类型，ASC或DESC
    - **统计逻辑**：
      - 不传参：统计当前时间之前的数据
      - 只传 `year`：统计指定年份最后一天之前的数据
      - 传 `year` + `month`：统计指定年月最后一天之前的数据
      - 数据处理：根据 `companyName` 字段分组，找出每组 `changeDate` 字段最大值的数据
    - **筛选条件**：统计 `currentEnterpriseStatus` 字段为 `cancelled` 或 `currentBusinessStatus` 字段为 `lost` 的记录
    - **分页逻辑**：按流失客户详情分页，每页返回指定数量的客户记录
    - **响应结构**：
      - `list`：分页的流失客户详情列表
      - `periodStats`：按时间周期统计的汇总数据（不分页）
      - `summary`：整体汇总信息
      - 分页信息：`total`、`page`、`pageSize`、`totalPages`
    - **权限控制**：基于客户数据权限控制数据访问范围：
      - `customer_data_view_all`：查看全部客户数据（无过滤条件）
      - `customer_data_view_by_location`：按区域查看，匹配 `customer.location = user.department.name`
      - `customer_data_view_own`：查看自己负责的客户，匹配顾问会计/记账会计/开票员身份
      - 状态变更原因分布
      - 客户状态详情（包含当前企业状态和业务状态）
    - **返回格式**：
      - `churnDate` 和 `lastServiceDate` 字段返回完整日期时间格式：`YYYY-MM-DD HH:MM:SS`
      - 支持精确到秒的时间记录，便于详细分析状态变更时点
  - `GET /api/reports/service-expiry-stats`：代理服务到期客户统计
    - **筛选逻辑**：
      - 从sys_expense表筛选agencyFee字段非空的数据
      - 按companyName分组，找出每个公司agencyEndDate值最大的记录
      - 将当前年月与agencyEndDate的年月比较，当前年月大于agencyEndDate年月则计为到期客户
    - **返回数据**：
      - `totalExpiredCustomers`：到期客户总数量
      - `expiredCustomers`：包含客户ID和agencyEndDate的到期客户列表
  - `GET /api/reports/accountant-client-stats`：会计负责客户数量统计
    - 查询参数：`export` (可选，导出Excel)
  - `DELETE /api/reports/cache/:reportType`：清除指定报表类型的缓存
  - `DELETE /api/reports/cache`：清除所有报表缓存

#### 客户档案查询接口详情
**接口地址**: `GET /api/customer/archive/search`
**访问权限**: 🌐 **公开接口，无需身份验证**
**功能说明**: 根据企业名称或统一社会信用代码筛选客户档案信息，必须提供至少一个查询参数
**查询参数**:
- `companyName` (必填其一): 企业名称，支持模糊查询
- `unifiedSocialCreditCode` (必填其一): 统一社会信用代码，支持模糊查询
- 注意：必须提供企业名称或统一社会信用代码中的至少一个参数，否则返回错误提示

**返回字段**:
- `companyName`: 企业名称
- `unifiedSocialCreditCode`: 统一社会信用代码
- `sealStorageNumber`: 章存放编号
- `onlineBankingArchiveNumber`: 网银托管档案号
- `paperArchiveNumber`: 纸质资料档案编号
- `archiveStorageRemarks`: 档案存放备注

**使用示例**:
```bash
# 按企业名称查询（无需认证Header）
GET /api/customer/archive/search?companyName=阿里巴巴

# 按统一社会信用代码查询  
GET /api/customer/archive/search?unifiedSocialCreditCode=91330100

# 组合查询
GET /api/customer/archive/search?companyName=阿里&unifiedSocialCreditCode=913301
```

**错误响应**:
```json
{
  "statusCode": 400,
  "message": "请输入企业名称或统一社会信用代码",
  "error": "Bad Request"
}
```

**注意事项**:
- ✅ 此接口为公开接口，无需提供JWT Token或任何身份认证
- ✅ 可直接通过浏览器或任何HTTP客户端访问
- ⚠️ 必须提供企业名称或统一社会信用代码中的至少一个参数
- ⚠️ 不提供任何参数时将返回400错误，提示"请输入企业名称或统一社会信用代码"

## 认证系统

系统支持三种认证方式：

### 1. JWT认证
- 用户登录后获取JWT令牌
- 所有API请求需要在请求头中携带令牌
- 令牌包含用户信息和权限

### 2. 合同令牌认证
- 为未登录用户提供临时访问特定资源的能力
- 主要用于合同签署和文件上传
- 令牌有效期默认为30分钟

### 3. 薪资二级密码认证
- 为薪资查看提供额外的安全保护
- 用户需要先设置薪资密码，验证后获得临时访问令牌
- 薪资访问令牌有效期为30分钟
- 适用于员工查看个人薪资的场景

## 薪资二级密码使用说明

为了保护薪资信息的安全性，系统为以下薪资查看接口实现了二级密码保护：

### 受保护的接口
- `GET /api/salary/my` - 获取我的薪资列表
- `GET /api/salary/my/{id}` - 获取我的薪资详情  
- `PATCH /api/salary/{id}/confirm` - 确认薪资记录

### 使用流程

#### 1. 设置薪资密码
```bash
POST /api/auth/salary/set-password
Headers: Authorization: Bearer <jwt_token>
Body: {
  "salaryPassword": "your_salary_password"
}
```

#### 2. 验证薪资密码获取访问令牌
```bash
POST /api/auth/salary/verify
Headers: Authorization: Bearer <jwt_token>
Body: {
  "salaryPassword": "your_salary_password"
}

Response: {
  "salaryAccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 1800,
  "message": "薪资访问权限验证成功"
}
```

#### 3. 使用薪资访问令牌访问薪资接口
```bash
GET /api/salary/my
Headers: 
  Authorization: Bearer <jwt_token>
  X-Salary-Token: <salary_access_token>
```

### 其他管理接口
- `GET /api/auth/salary/check-password` - 检查是否已设置薪资密码
- `POST /api/auth/salary/change-password` - 修改薪资密码
- `PATCH /api/auth/salary/reset-password/{userId}` - 重置用户薪资密码（管理员专用）

### 注意事项
- 薪资访问令牌有效期为30分钟，过期后需要重新验证
- 每个用户需要单独设置自己的薪资密码
- 薪资密码与登录密码独立，可以设置不同的密码
- 管理员查看薪资不需要二级密码验证

## 文件存储系统

系统使用MinIO作为对象存储解决方案：

- 支持文件上传、下载、删除
- 返回永久有效的文件访问URL
- 支持中文文件名
- 支持通过JWT或合同令牌认证上传文件

## 环境配置与部署

### 开发环境

#### 前置条件
- Node.js (v20.x)
- pnpm
- Docker & Docker Compose

#### 安装依赖
```bash
pnpm install
```

#### 启动开发环境
```bash
# 使用Docker运行开发环境
docker-compose up -d

# 直接在本地运行
pnpm run start:dev
```

### 生产环境部署
```bash
# 构建和启动生产环境容器
docker-compose -f docker-compose.prod.yml up -d
```

## API文档

项目集成了Swagger文档，启动应用后可通过以下地址访问：
```
http://localhost:3000/api/docs
```

## 环境变量配置

系统支持通过`.env`文件或环境变量配置以下参数：

### 应用配置
- `APP_PORT`: 应用端口号 (默认: 3000)
- `APP_ENV`: 运行环境 (development/production/test, 默认: development)
- `LOG_LEVEL`: 日志级别 (error/warn/info/debug, 默认: info)
- `CORS_ORIGIN`: CORS允许的来源 (默认: *)

### 数据库配置
- `DB_HOST`: 数据库主机 (默认: localhost)
- `DB_PORT`: 数据库端口 (默认: 3306)
- `DB_USERNAME`: 数据库用户名 (必填)
- `DB_PASSWORD`: 数据库密码 (必填)
- `DB_DATABASE`: 数据库名 (默认: zhongyue)
- `DB_SYNCHRONIZE`: 是否自动同步实体到数据库 (默认: false)
- `DB_LOGGING`: 是否启用SQL日志 (默认: false)

### JWT配置
- `JWT_SECRET`: JWT密钥 (必填)
- `JWT_EXPIRES_IN`: JWT有效期 (默认: 1d)
- `SALARY_JWT_SECRET`: 薪资访问JWT密钥 (可选，不设置时使用JWT_SECRET + '_salary')

### MinIO配置
- `MINIO_ENDPOINT`: MinIO服务地址 (默认: localhost)
- `MINIO_PORT`: MinIO服务端口 (默认: 9000)
- `MINIO_USE_SSL`: 是否使用SSL (默认: false)
- `MINIO_ACCESS_KEY`: MinIO访问密钥 (必填)
- `MINIO_SECRET_KEY`: MinIO秘密密钥 (必填)
- `MINIO_BUCKET`: MinIO存储桶名称 (默认: zhongyue)
- `MINIO_PATH_STYLE`: 是否使用路径样式URL (默认: true)

## 开发指南

### 项目规范
- 使用TypeScript强类型
- 遵循NestJS模块化设计原则
- 使用DTO进行数据验证和转换
- 使用实体类定义数据库模型
- 统一的错误处理和响应格式

### 添加新功能
1. 在modules目录下创建新模块
2. 实现Controller, Service, Entity, DTO等组件
3. 在app.module.ts中注册新模块
4. 添加单元测试和E2E测试

### 代码风格
- 使用ESLint进行代码质量检查
- 使用Prettier进行代码格式化
- 遵循NestJS官方代码风格指南

## 技术架构图

```
客户端应用 <-> Nginx/负载均衡 <-> NestJS应用 <-> MySQL数据库
                                    |
                                    v
                                  MinIO存储
```

## 贡献指南

请遵循项目的代码风格和提交规范进行开发：

1. 创建功能分支
2. 添加功能或修复bug
3. 编写测试
4. 提交Pull Request

## 薪资生成时间限制功能

### 功能概述
为了防止误操作和确保数据安全，系统对薪资自动生成功能添加了时间限制。

### 限制规则
- **限制时间点**: 2025年6月30日
- **限制范围**: 不能生成2025年6月及其之前任何月份的薪资数据
- **适用接口**: `POST /api/salary/auto-generate`

### 错误处理
当尝试生成受限时间段的薪资数据时，系统会返回以下错误：
```json
{
  "statusCode": 400,
  "message": "不能生成2025年6月及其之前的薪资数据。尝试生成的月份：2025-05",
  "error": "Bad Request"
}
```

### 使用示例
```bash
# ❌ 错误：尝试生成2025年5月的薪资（会被拒绝）
POST /api/salary/auto-generate?month=2025-05-01

# ❌ 错误：尝试生成2025年6月的薪资（会被拒绝）
POST /api/salary/auto-generate?month=2025-06-15

# ✅ 正确：生成2025年7月的薪资（会被允许）
POST /api/salary/auto-generate?month=2025-07-01

# ✅ 正确：生成2025年8月的薪资（会被允许）
POST /api/salary/auto-generate?month=2025-08-01
```

### 技术实现
- 在`SalaryAutoUpdateService.generateMonthlySalaries()`方法中添加时间检查
- 使用moment.js进行日期比较
- 返回标准的HTTP 400错误状态码
- 提供详细的错误信息，包含尝试生成的月份

### 安全考虑
- 防止误操作：避免生成过期的薪资数据
- 数据完整性：确保薪资数据的时效性
- 审计追踪：记录所有被拒绝的生成请求

## 数据导入覆盖功能使用说明

### 功能概述
系统支持基于员工姓名和年月（YYYY-MM格式）的重复数据覆盖导入。当导入文件中包含与现有数据相同姓名和年月的记录时，系统会自动删除现有记录并插入新数据，实现完全覆盖。

### 支持的导入接口
| 模块 | 接口地址 | 说明 |
|------|----------|------|
| 社保信息 | `POST /api/social-insurance/import` | 导入社保信息数据 |
| 补贴合计 | `POST /api/subsidy-summary/import` | 导入补贴合计数据 |
| 朋友圈扣款 | `POST /api/friend-circle-payment/import` | 导入朋友圈扣款数据 |
| 考勤扣款 | `POST /api/attendance-deduction/import` | 导入考勤扣款数据 |
| 保证金 | `POST /api/deposit/upload` | 导入保证金记录 |

### 覆盖规则
1. **匹配条件**：姓名(name) + 年月(yearMonth的YYYY-MM部分)
2. **覆盖行为**：如果发现匹配的现有记录，系统会：
   - 删除所有匹配的现有记录
   - 插入新导入的数据
3. **年月格式**：支持多种日期格式，系统会自动提取YYYY-MM部分进行匹配

### 使用示例

#### 文件格式要求
所有导入文件必须包含以下必填字段：
- **姓名**：员工姓名
- **年月**：日期字段，格式如 2024-01-15、2024/01/15 等

#### 覆盖场景示例
假设数据库中已有记录：
```
姓名: 张三, 年月: 2024-01-15, 其他数据...
```

当导入包含以下记录的文件时：
```
姓名: 张三, 年月: 2024-01-20, 其他数据...
```

系统执行流程：
1. 检测到姓名"张三"和年月"2024-01"匹配现有记录
2. 删除数据库中所有姓名为"张三"且年月为"2024-01"的记录
3. 插入新导入的记录

### 注意事项
1. **自动覆盖**：所有导入接口默认启用覆盖功能，无需额外参数
2. **完全替换**：覆盖是完全替换，不是合并更新
3. **批量处理**：支持在一次导入中处理多个员工多个月份的数据
4. **事务保护**：每条记录的删除和插入在同一事务中执行，确保数据一致性
5. **错误处理**：如果某条记录处理失败，不会影响其他记录的导入

### 技术实现
- **后端处理**：TypeScript/NestJS + Python脚本联合处理
- **数据库操作**：使用事务确保数据一致性
- **日期匹配**：使用MySQL的DATE_FORMAT函数进行年月匹配
- **错误恢复**：单条记录失败不影响整批导入
- **查询优化**：统一使用 `DATE_FORMAT(field, "%Y-%m") LIKE "%YYYY-MM%"` 进行年月模糊查询

详细文档请查看 [docs/README.md](docs/README.md)
详细文档请查看 [docs/README.md](docs/README.md)

## 联系与支持

如有问题或需要支持，请联系项目管理员。

## 项目文档

本项目使用Viki文档系统与GitHub集成，提供完整的开发文档。

### 查看文档

1. **在线查看**：部署Viki站点后，可通过站点URL访问文档

2. **本地查看**：
   ```bash
   # 安装Viki CLI
   npm install -g viki-cli
   
   # 启动文档服务
   viki serve
   ```
   然后在浏览器访问 http://localhost:8080

### 文档结构

- **项目概述**: 系统整体介绍与架构说明
- **开发指南**: 开发环境配置、代码规范和开发流程
- **API文档**: 详细的API接口说明和使用示例
- **数据库设计**: 数据库结构和关系说明
- **部署指南**: 环境部署与配置说明

### 贡献文档

1. 修改相应的markdown文档
2. 提交更改到GitHub
3. 文档会自动同步到Viki系统

详细文档请查看 [docs/README.md](docs/README.md)

## 薪资密码重置功能

### 功能概述
为了帮助忘记薪资密码的员工重新获得访问权限，系统为管理员提供了薪资密码重置功能。

### 重置流程
1. **管理员操作**：管理员通过接口重置指定用户的薪资密码
2. **数据清理**：系统清空目标用户的 `salaryPassword` 和 `salaryPasswordUpdatedAt` 字段
3. **用户重设**：用户调用设置密码接口重新建立薪资密码

### 接口说明
```bash
# 管理员重置用户薪资密码
PATCH /api/auth/salary/reset-password/{userId}
Headers: 
  Authorization: Bearer <admin_jwt_token>

# 用户重新设置薪资密码
POST /api/auth/salary/set-password
Headers: 
  Authorization: Bearer <user_jwt_token>
Body: {
  "salaryPassword": "new_password"
}
```

### 权限控制
- **重置权限**：仅 `super_admin` 和 `admin` 角色可执行重置操作
- **安全性**：双重权限验证（装饰器 + 服务层验证）
- **审计追踪**：返回操作员和目标用户信息，便于审计

### 技术特点
- ✅ **数据一致性**：使用数据库事务确保操作原子性
- ✅ **安全性**：不生成临时密码，避免安全隐患
- ✅ **用户体验**：用户可自主设置符合个人习惯的密码
- ✅ **代码复用**：重用现有的密码设置逻辑，减少代码冗余

### 使用场景
- 员工忘记薪资密码无法查看薪资
- 新员工入职需要初始化薪资密码
- 安全事件后需要强制重置薪资密码
- 员工调岗后的权限重置

### 群组管理API
- `/api/groups`：群组管理的完整CRUD接口
  - `POST /api/groups`：创建群组记录
    - 请求体包含：`chatId`、`name`、`owner`、`members`、`lastMessage`等字段
    - `members` 字段支持数组格式，包含成员信息对象
  - `GET /api/groups`：查询群组列表（支持分页）
  - `GET /api/groups/:id`：获取单个群组详情
  - `GET /api/groups/chat/:chatId`：根据聊天ID查询群组
  - `PATCH /api/groups/:id`：更新群组信息
  - `DELETE /api/groups/:id`：删除群组记录
  - `DELETE /api/groups/batch/remove`：批量删除群组
    - 请求体格式：
      ```json
      {
        "ids": [1, 2, 3, 4, 5]
      }
      ```
    - 响应格式：
      ```json
      {
        "message": "成功删除 3 个群组",
        "deletedCount": 3
      }
      ```
  - `PATCH /api/groups/:id/last-message`：更新群组最后消息
    - 支持三种消息类型：`general`（普通消息）、`employee`（员工消息）、`customer`（客户消息）
    - 请求体格式（与数据库字段格式一致）：
      ```json
      {
        "from": "用户ID",
        "msgId": "消息ID",
        "content": "消息内容",
        "fromType": "employee|customer",
        "createTime": "2025-07-21T16:00:00Z"
      }
      ```
  - `PATCH /api/groups/:id/alert-settings`：更新群组提醒设置
  - `GET /api/groups/alerts/list`：获取需要提醒的群组列表

### 13. 业务选项管理模块 (business-options)
- **功能概述**：提供统一的业务选项管理功能，支持默认选项和自定义选项的完整生命周期管理
- **业务类别**：
  - `change_business`：变更业务（地址变更、名称变更、股东变更等）
  - `administrative_license`：行政许可（食品经营许可证、卫生许可证等）
  - `other_business_basic`：其他业务（基础）（工商注销、税务处理等）
  - `other_business_outsourcing`：其他业务（外包）（代理注销、商标注册等）
  - `other_business_special`：其他业务（特殊）（代办烟草证、出口退税等）
- **核心功能**：
  - 业务选项的CRUD操作（创建、查询、更新、删除）
  - 支持按业务类别查询所有选项
  - 支持按默认/自定义选项筛选
  - 分页查询功能，默认每页10条记录
  - 唯一性验证：同一类别下选项值唯一
  - 默认选项保护：不允许删除默认选项
- **权限控制**：
  - 查询接口：所有登录用户可访问
  - 创建/更新/删除接口：仅限管理员和超级管理员
- **数据库设计**：
  - 表名：`business_options`
  - 唯一索引：`(category, option_value)` 确保同一类别下选项值唯一
  - 支持字段：业务类别、选项值、是否默认、创建人、创建时间、更新时间
- **API接口**：
  - `GET /api/business-options`：获取业务选项列表（分页）
  - `GET /api/business-options/category/:category`：根据类别获取业务选项
  - `GET /api/business-options/:id`：根据ID获取业务选项详情
  - `POST /api/business-options`：创建业务选项（需要管理员权限）
  - `POST /api/business-options/batch`：批量创建业务选项（需要管理员权限）
  - `PATCH /api/business-options/:id`：更新业务选项（需要管理员权限）
  - `DELETE /api/business-options/:id`：删除业务选项（需要管理员权限，不能删除默认选项）
- **业务规则**：
  - 创建时自动验证 `category + optionValue` 的唯一性
  - 更新选项值时需重新验证唯一性
  - 删除操作禁止删除 `isDefault = true` 的选项
  - 批量创建时自动跳过已存在的选项
- **数据初始化**：
  - 提供完整的默认数据初始化SQL脚本
  - 支持5个业务类别共计80+个默认选项
  - 使用 `ON DUPLICATE KEY UPDATE` 确保幂等性
- **前端对接**：
  - 前端可通过类别接口获取下拉选项列表
  - 支持管理员在费用页面添加自定义选项
  - 自定义选项在不同浏览器/设备间自动同步
  - 前端保留默认选项作为兜底方案

## 更新历史

### 2025-10-30
- **业务选项管理模块新增**：
  - 创建完整的业务选项管理模块，支持5个业务类别的选项管理
  - 实现完整的CRUD操作和权限控制
  - 提供数据库表创建脚本和默认数据初始化脚本
  - 集成到主应用模块，注册所有必要的实体和路由
  - 完整的API文档支持（Swagger）
  - 默认选项保护机制，防止误删除
  - 唯一性验证，防止重复数据
  - 支持批量创建功能，方便数据初始化
  - 数据库迁移脚本：
    - `database/migrations/2025-10-30-create-business-options-table.sql`
    - `database/migrations/2025-10-30-init-default-business-options.sql`

### 2025-10-21
- **薪资已发放状态锁定功能**：
  - **功能概述**：当薪资记录的 `isPaid` 字段为 `true` 时,禁止对该记录进行任何修改操作,确保已发放的薪资数据不被篡改
  - **影响接口**：
    - `PATCH /api/salary/:id` - 更新薪资记录接口
    - `PATCH /api/salary/:id/confirmed` - 更新薪资确认状态接口
    - `DELETE /api/salary/:id` - 删除薪资记录接口
    - `PATCH /api/salary/:id/confirm` - 员工确认薪资记录接口
    - **自动计算薪资功能** - 自动生成/更新薪资数据时跳过已发放的记录
  - **验证逻辑**：
    - 更新薪资记录：已发放的薪资不允许任何修改
    - 取消确认状态：已发放的薪资不允许取消确认
    - 删除薪资记录：已发放的薪资不允许删除
    - 员工确认/取消确认：已发放的薪资不允许取消确认(但允许确认)
    - **自动计算薪资：已发放的薪资自动跳过，不会被自动更新功能修改**
  - **错误响应示例**：
    ```json
    {
      "statusCode": 403,
      "message": "该薪资已发放,不允许修改",
      "error": "Forbidden"
    }
    ```
  - **技术实现**：
    - 在所有修改、删除操作前检查 `isPaid` 状态
    - 使用 `ForbiddenException` 返回403错误
    - 自动计算薪资时使用 `continue` 跳过已发放记录,并记录警告日志
    - 保持与前端已有的防护措施一致
  - **修改文件**：
    - `src/modules/salary/salary.service.ts` - 在 `update`、`updateConfirmed`、`remove`、`confirmSalary` 方法中添加验证
    - `src/modules/salary/services/salary-auto-update.service.ts` - 在 `generateMonthlySalaries` 方法中添加验证,跳过已发放的薪资
  - **自动计算行为**：
    - 未发放薪资(`isPaid = false`)：正常更新计算结果
    - 已发放薪资(`isPaid = true`)：跳过更新,记录警告日志
    - 日志示例：`跳过员工 张三 的薪资记录更新 - 该薪资已发放，不允许修改`
  - **前端适配**：前端已完成相应的UI禁用和提示功能,此次后端修改提供双重保护
  - **向后兼容**：不影响现有未发放薪资的操作,只对已发放薪资增加保护

### 2025-10-16
- **薪资管理模块新增确认状态更新接口**：
  - **功能概述**：新增专用接口用于更新薪资记录的 `isConfirmed`（确认状态）字段
  - **接口路径**：`PATCH /api/salary/:id/confirmed`
  - **权限控制**：仅限 `salary_admin` 和 `super_admin` 角色可以调用
  - **请求参数**：
    - 路径参数：`id` - 薪资记录ID
    - 请求体：`{ "isConfirmed": true/false }`
  - **响应数据**：返回更新后的完整薪资记录
  - **新增文件**：
    - `src/modules/salary/dto/update-confirmed.dto.ts` - 确认状态更新DTO
  - **修改文件**：
    - `src/modules/salary/salary.controller.ts` - 添加新路由和控制器方法
    - `src/modules/salary/salary.service.ts` - 添加 `updateConfirmed` 业务逻辑方法
  - **特性说明**：
    - 独立的更新接口，只修改 `isConfirmed` 字段，不影响其他数据
    - 完整的权限验证和参数校验
    - 完整的Swagger API文档支持
    - 统一的错误处理机制
  - **使用场景**：管理员批量确认薪资发放、更正确认状态等
  - **安全考虑**：
    - 权限控制：只有管理员和超级管理员可以修改
    - 参数验证：通过 DTO 和 class-validator 进行严格验证
    - 记录存在性检查：确保记录存在后再执行更新
  - **API文档**：已在Swagger中完整标注，包含请求示例和响应说明

- **薪资管理模块字段删除 - cashPaid（已发现金）字段**：
  - **功能概述**：从薪资管理系统中移除不再使用的 cashPaid（已发现金）字段
  - **修改范围**：
    - 实体类：删除 `sys_salary` 表中的 `cashPaid` 字段定义
    - DTO类：从创建、更新、查询、导出DTO中删除 `cashPaid` 相关字段
    - Controller：删除 `cashPaid` 相关的API查询参数和接口定义
    - Service：删除 `cashPaid` 相关的计算和查询逻辑
    - 自动更新服务：删除 `cashPaid` 相关的自动填充逻辑
  - **计算公式调整**：
    - 原公式：`对公 = 应发合计 - 银行卡/微信 - 已发现金`
    - 新公式：`对公 = 应发合计 - 银行卡/微信`
  - **数据库变更**：
    - 需要执行SQL删除语句：`ALTER TABLE sys_salary DROP COLUMN cashPaid;`
  - **影响文件**：
    - `src/modules/salary/entities/salary.entity.ts`
    - `src/modules/salary/dto/create-salary.dto.ts`
    - `src/modules/salary/dto/update-salary.dto.ts`
    - `src/modules/salary/dto/query-salary.dto.ts`
    - `src/modules/salary/dto/export-salary.dto.ts`
    - `src/modules/salary/salary.controller.ts`
    - `src/modules/salary/salary.service.ts`
    - `src/modules/salary/services/salary-auto-update.service.ts`
  - **向后兼容**：删除字段会影响现有数据，建议先备份数据库
  - **API变更**：
    - 删除查询参数：`cashPaidMin`、`cashPaidMax`
    - 删除接口字段：`cashPaid`

### 2025-10-16
- **员工查询接口payrollCompany字段空值查询功能**：
  - **功能概述**：为员工查询接口的 `payrollCompany`（发工资公司）字段添加空值查询支持
  - **实现方案**：使用空字符串或特殊标识符查询空值
    - 传入空字符串 `""` 可查询发工资公司为空的员工记录
    - 传入 `"NULL"` 或 `"empty"` 也可查询空值记录
    - 传入其他值时进行正常的模糊查询
  - **技术实现**：
    - 在 `employee.service.ts` 的 `findAll` 方法中添加空值判断逻辑
    - 将判断条件从 `if (payrollCompany)` 改为 `if (payrollCompany !== undefined)`
    - 使用 TypeORM 的 `IsNull()` 操作符查询空值记录
    - 使用 `Like()` 操作符进行模糊查询
  - **使用示例**：
    - 查询空值：`GET /api/employee?payrollCompany=` 或 `GET /api/employee?payrollCompany=NULL` 或 `GET /api/employee?payrollCompany=empty`
    - 正常查询：`GET /api/employee?payrollCompany=北京中岳`
  - **影响接口**：`GET /api/employee` - 员工列表查询接口
  - **影响文件**：
    - `src/modules/employee/employee.service.ts`
    - `src/modules/employee/dto/query-employee.dto.ts`
  - **API文档更新**：在 Swagger 文档中添加了空值查询的说明
  - **向后兼容**：完全向后兼容，不影响现有查询功能
  - **问题修复**：修复了传入空字符串时仍然返回非空值记录的问题

- **薪资导出CSV字段格式优化**：
  - **功能概述**：优化薪资导出CSV接口，确保身份证号和银行卡号字段作为字符串类型导出
  - **修改字段**：
    - `idCard`：身份证号 - 添加制表符前缀，防止Excel显示为科学计数法
    - `bankCardNumber`：银行卡号 - 添加制表符前缀，防止Excel显示为科学计数法
  - **技术实现**：
    - 在导出数据处理逻辑中，为这两个字段的值添加 `\t` 制表符前缀
    - 确保Excel在打开CSV文件时将这些字段识别为文本类型而非数字类型
  - **影响接口**：`GET /api/salary/export/csv` - 薪资导出CSV接口
  - **影响文件**：`src/modules/salary/salary.service.ts`
  - **用户体验**：解决了长数字字段（如18位身份证号、16-19位银行卡号）在Excel中显示为科学计数法的问题
  - **向后兼容**：不影响数据的实际值，只是改变了CSV导出时的格式化方式

### 2025-10-15
- **费用管理模块收据查看接口优化**：
  - **问题修复**：修复收据查看接口(`GET /api/expense/receipt`)不显示负数费用的问题
  - **原因分析**：原代码中判断条件为`expense[field.amountField] > 0`，只允许正数费用显示
  - **解决方案**：将判断条件改为`expense[field.amountField] !== 0`，允许负数费用也能显示
  - **业务场景**：支持显示退费、调整等负数费用记录
  - **影响范围**：
    - 修改文件：`src/modules/expense/expense.service.ts`
    - 影响方法：`viewReceipt()`
  - **向后兼容**：不影响现有正数费用的显示，只是新增了负数费用的显示支持

### 2025-10-14
- **费用管理模块新增业绩字段**：
  - **功能概述**：为费用表（sys_expense）添加基础业务业绩和外包业务业绩两个新字段，并在薪资自动计算时自动填充
  - **新增字段**：
    - `basicBusinessPerformance`：基础业务业绩（DECIMAL(10,2)）- 当前费用记录的基础业务费用总和
    - `outsourcingBusinessPerformance`：外包业务业绩（DECIMAL(10,2)）- 当前费用记录的外包业务费用总和
  - **字段位置**：新字段位于 `otherBusinessSpecialFee` 字段之后
  - **功能覆盖**：
    - 更新费用实体（Expense Entity）：添加新字段的数据库映射定义
    - 更新创建费用DTO：添加新字段的验证和API文档
    - 更新CSV导出功能：在导出映射中添加新字段的中文列名
    - 提供数据库迁移脚本：`database/migrations/2025-10-14-add-business-performance-fields.sql`
    - **自动计算薪资服务**：在计算业务提成时自动计算并填充业绩字段
  - **自动计算逻辑**（在薪资自动更新服务中实现）：
    - **基础业务业绩计算**：
      ```
      basicBusinessPerformance = 
        办照费用 + 代理费 + 社保代理费(仅新增业务) + 
        公积金代理费 + 统计局报表费 + 变更费 + 
        行政许可费 + 其他业务费 + 客户资料整理费
      ```
      - 注意：社保代理费仅在 `socialInsuranceBusinessType` = '新增' 或为空时计入
    - **外包业务业绩计算**：
      ```
      outsourcingBusinessPerformance = 
        牌子费 + 一般刻章费用 + 记账软件费 + 
        地址费 + 开票软件费 + 其他业务外包费
      ```
    - **触发时机**：执行薪资自动更新时（调用 `generateMonthlySalaries` 方法）
    - **更新位置**：`SalaryAutoUpdateService.calculateBusinessCommission` 方法
    - **清空机制**：执行薪资生成前会清空指定日期范围内的业绩字段，确保数据一致性
- **FAQ**：
  - **基础业务费用总和由哪些费用构成？** 系统在 `SalaryAutoUpdateService.calculateBusinessCommission` 中将办照费(`licenseFee`)、代理费(`agencyFee`)、符合条件的社保代理费(`socialInsuranceAgencyFee`，仅限业务类型为“新增”或空值)、公积金代理费(`housingFundAgencyFee`)、统计局报表费(`statisticalReportFee`)、变更费(`changeFee`)、行政许可费(`administrativeLicenseFee`)、其他业务费(`otherBusinessFee`，基础类)、客户资料整理费(`customerDataOrganizationFee`)以及地址费(`addressFee`)累加成基础业务费用总和，用于匹配提成区间。
  - **基础业务业绩是否包含地址费？** 包含。`SalaryAutoUpdateService.calculateBusinessCommission` 会将地址费一并计入 `basicBusinessPerformance`，并在计算提成时对地址部分单独按10%固定比例计提；`outsourcingBusinessPerformance` 仅包含品牌费、一般刻章费、记账软件费、开票软件费及其他外包业务费。
  - **地址费的提成归属在哪个提成科目？** 地址费产生的提成现在按10%比例计入 `businessCommissionOutsource`（外包业务提成），不再进入 `businessCommissionOwn`。地址费仍然参与基础业务费用总和与 `basicBusinessPerformance` 统计，以保证提成区间和业绩数据不变，但实际提成金额会并入外包业务提成字段，便于与其他外包类费用统一分析。
  - **收费额区间如何判定？** 自动计算薪资时会先求出指定员工在统计周期内的基础业务费用总和(`totalBasicFee`)，然后根据员工的提成比率岗位选择对应的提成表（顾问、销售、其它）。系统使用 `feeRange` 字段（形如 `5000-10000`）的起止值作为区间，通过 `? BETWEEN SUBSTRING_INDEX(feeRange,'-',1) AND SUBSTRING_INDEX(feeRange,'-',-1)` 的SQL条件自动匹配所属区间，从而确定应使用的提成比率。
  - **技术实现**：
    - TypeORM实体字段定义完整，包含类型、精度、注释等
    - DTO验证使用 `@IsOptional()` 和 `@IsNumber()` 装饰器
    - CSV导出字段映射按逻辑顺序排列，位于其他业务收费(特殊)之后
    - 薪资服务在更新业务提成时同步更新业绩字段（3个更新点全部覆盖）
  - **向后兼容**：所有新字段均为可选字段，不影响现有功能的正常使用
  - **数据一致性**：业绩字段值与业务提成计算逻辑完全一致，确保数据准确性

- **费用管理模块业务查询筛选功能（2025-10-30优化）**：
  - **功能概述**：为费用列表接口和导出接口添加"业务查询"筛选字段，支持根据不同业务类型快速筛选费用记录
  - **新增参数**：`businessInquiry` - 业务查询筛选字段（可选，支持多选）
  - **参数类型**：`string | string[]` - 可以传递单个值或数组
  - **多选示例**：
    - 单个值：`businessInquiry=代理费`
    - 多个值：`businessInquiry=代理费&businessInquiry=记账软件费`
    - 数组形式：`businessInquiry[]=代理费&businessInquiry[]=记账软件费`
  - **影响接口**：
    - `GET /api/expense?businessInquiry=代理费&businessInquiry=记账软件费` - 费用列表查询接口（支持多选）
    - `GET /api/expense/export/csv?businessInquiry=代理费&businessInquiry=记账软件费` - 费用导出CSV接口（支持多选）
  - **查询规则（2025-10-30优化）**：
    - ✅ **费用类型**：硬编码在代码中的12个费用字段，规则保持不变（字段非空且非0筛选）
    - ✅ **其他业务选项**：从 `business_options` 表动态获取，支持5个业务类别的所有选项
    - ✅ **智能识别**：系统自动判断搜索值属于费用类型还是业务选项
  - **功能增强**：支持业务查询多选筛选
    - 多个业务查询值之间为"或"（OR）关系
    - 例如：选择"代理费"和"记账软件费"，将返回包含代理费或记账软件费的所有费用记录
    - 参考项目中已有的 `businessType` 和 `socialInsuranceBusinessType` 多选实现
  - **支持的业务类型**：
    - **费用类型（硬编码，非空非0筛选）**：
      - 代理费 (agencyFee)
      - 记账软件费 (accountingSoftwareFee)
      - 开票软件费 (invoiceSoftwareFee)
      - 地址费 (addressFee)
      - 社保代理费 (socialInsuranceAgencyFee)
      - 公积金代理费 (housingFundAgencyFee)
      - 统计局报表费 (statisticalReportFee)
      - 客户资料整理费 (customerDataOrganizationFee)
      - 办照费用 (licenseFee)
      - 牌子费 (brandFee)
      - 备案章费用 (recordSealFee)
      - 一般刻章费用 (generalSealFee)
    - **业务选项（动态获取，JSON数组包含筛选）**：
      - 从 `business_options` 表查询，根据 `category` 字段映射到对应的费用表字段：
        * `change_business` → `changeBusiness`（变更业务）
        * `administrative_license` → `administrativeLicense`（行政许可）
        * `other_business_basic` → `otherBusiness`（其他业务基础）
        * `other_business_outsourcing` → `otherBusinessOutsourcing`（其他业务外包）
        * `other_business_special` → `otherBusinessSpecial`（其他业务特殊）
      - 管理员可在 `/api/business-options` 接口中添加自定义业务选项，前端自动同步
  - **使用示例**：
    ```bash
    # 查询包含代理费的费用记录
    GET /api/expense?businessInquiry=代理费
    
    # 查询包含地址变更业务的费用记录（从business_options表获取）
    GET /api/expense?businessInquiry=地址变更
    
    # 导出包含社保代理费的费用记录
    GET /api/expense/export/csv?businessInquiry=社保代理费
    
    # 混合查询：代理费（费用类型） + 地址变更（业务选项）
    GET /api/expense?businessInquiry=代理费&businessInquiry=地址变更
    ```
  - **技术实现**：
    - 在DTO中添加 `businessInquiry` 可选字段（QueryExpenseDto、ExportExpenseDto）
    - 创建可重用方法 `buildBusinessInquiryConditions`，实现智能筛选逻辑
    - 费用类型：检查硬编码映射表，使用 `IS NOT NULL AND != 0` 条件查询
    - 业务选项：查询 `business_options` 表，根据 `category` 映射到对应字段，使用 `JSON_CONTAINS` 查询
    - 注入 `BusinessOption` repository，支持动态查询业务选项
  - **数据库集成**：
    - 费用模块（ExpenseModule）注册 `BusinessOption` 实体
    - 支持跨模块数据查询和关联
  - **优势**：
    - ✅ 不再需要硬编码所有业务选项
    - ✅ 业务选项由数据库 `business_options` 表动态维护
    - ✅ 代码更简洁、更易维护
    - ✅ 支持管理员动态添加自定义选项
  - **向后兼容**：新增功能不影响现有查询功能，参数为可选参数
  - **文档更新**：完整的Swagger API文档和README说明

### 2025-10-13
- **费用导出CSV接口字段扩展**：
  - 为 `/api/expense/export/csv` 接口添加四个提成字段的导出功能
  - **新增导出字段**：
    - `businessCommissionOwn`: 基础业务提成
    - `businessCommissionOutsource`: 外包业务提成
    - `specialBusinessCommission`: 特殊业务提成
    - `agencyCommission`: 代理费提成
  - **字段位置**：新增字段位于"业务类型"之后、"创建时间"之前
  - **向后兼容**：不影响现有导出功能，只是增加了额外的提成数据列
  - **技术实现**：在 `expense.service.ts` 的 `fieldMapping` 对象中添加字段映射关系

### 2025-10-13（早前更新）
- **业务提成计算逻辑优化 - 社保代理费计入条件调整**：
  - **修改内容**：调整基础业务提成中社保代理费的计入条件
  - **原规则**：社保代理费仅在 `socialInsuranceBusinessType = '新增'` 时计入基础业务费用
  - **新规则**：社保代理费在以下任一情况下计入基础业务费用：
    - `socialInsuranceBusinessType = '新增'`
    - `socialInsuranceBusinessType` 字段为 `null`
    - `socialInsuranceBusinessType` 字段为空字符串 `''`
  - **影响范围**：
    - 业务提成计算方法 `calculateBusinessCommission()`
    - 涉及3处社保代理费计算逻辑（第427行、第499行、第536行）
  - **计算逻辑更新**：
    ```typescript
    // 新的社保代理费计入条件
    const socialInsuranceAgencyFee = (
      expense.socialInsuranceBusinessType === '新增' || 
      !expense.socialInsuranceBusinessType || 
      expense.socialInsuranceBusinessType === ''
    ) ? Number(expense.socialInsuranceAgencyFee || 0) : 0;
    ```
  - **业务影响**：扩大了社保代理费的计入范围，包含历史数据中未填写业务类型的记录
  - **向后兼容**：不影响已有的业务逻辑，仅扩展计入条件

### 2025-10-13（早前更新）
- **薪资数据导入时间限制功能**：
  - **功能概述**：为保证金、社保信息、补贴汇总和朋友圈缴费导入接口添加时间验证，只允许导入上个月的数据
  - **影响接口**：
    - `POST /api/deposit/upload` - 保证金导入接口
    - `POST /api/social-insurance/import` - 社保信息导入接口
    - `POST /api/subsidy-summary/import` - 补贴汇总导入接口
    - `POST /api/friend-circle-payment/import` - 朋友圈缴费导入接口
  - **限制规则**：当月导入时只能导入上个月的数据，不能导入其他时间的数据
  - **错误提示**：当因为时间限制导入失败时，返回错误信息："只能导入上个月数据"
  - **验证时机**：在数据导入前进行验证，发现不符合时间要求的数据立即拒绝整个导入操作
  - **技术实现**：
    - 在Python导入脚本中添加时间验证逻辑
    - 自动计算当前月份的上个月（支持跨年情况，如2025年1月会正确计算为2024年12月）
    - 检查导入文件中所有记录的日期字段年月部分（YYYY-MM格式）
      - 保证金：检查"扣除日期"字段
      - 社保信息：检查"年月"字段
      - 补贴汇总：检查"年月"字段
      - 朋友圈缴费：检查"年月"字段
    - 提供详细的验证失败信息，包含不符合要求的记录列表
  - **错误响应示例**：
    ```json
    {
      "success": false,
      "error_type": "invalid_date_range",
      "error_message": "只能导入上个月数据",
      "allowed_month": "2025-09",
      "invalid_dates": [
        {
          "row": 1,
          "name": "张三",
          "date": "2025-08-15",
          "year_month": "2025-08"
        }
      ]
    }
    ```
  - **使用场景**：防止误导入错误月份的薪资数据，确保数据的时效性和准确性
  - **向后兼容**：不影响现有的导入功能，只是增加了时间验证限制
  - **依赖包**：Python脚本使用 `python-dateutil` 包进行日期计算

### 2025-10-11
- **薪资管理 - 代理费提成计算规则优化**：
  - **修改内容**：记账软件费和开票软件费添加业务类型筛选条件
  - **新规则**：记账软件费和开票软件费只有在 `businessType = '续费'` 时才计算10%提成
  - **影响范围**：
    - 代理费提成计算方法 `calculateAgencyFeeCommission()`
    - 费用记录提成更新方法 `updateExpenseAgencyCommission()`
  - **计算逻辑**：
    - ✅ **代理费** (1%提成)：只统计 `businessType = '续费'` 的代理费
    - ✅ **社保代理费** (1%提成)：只统计 `socialInsuranceBusinessType = '续费'` 的社保代理费
    - ✅ **记账软件费** (10%提成)：**新增限制** - 只统计 `businessType = '续费'` 的记账软件费
    - ✅ **开票软件费** (10%提成)：**新增限制** - 只统计 `businessType = '续费'` 的开票软件费
    - ✅ **地址费** (10%提成)：保持不变，所有业务类型都计算提成
  - **公式**：
    ```
    代理费提成 = (续费的代理费 + 续费的社保代理费) × 1% 
                + (续费的记账软件费 + 续费的开票软件费 + 所有地址费) × 10%
    ```
  - **技术实现**：
    - 修改SQL查询，使用 `CASE WHEN` 条件判断业务类型
    - 优化日志输出，明确标注各费用项的筛选条件
    - 确保逐条记录更新时也应用相同的业务逻辑
  - **向后兼容**：不影响历史数据，仅在新的薪资生成时应用新规则

### 2025-09-30
- **费用管理模块新增客户资料整理相关字段**：
  - 为费用管理模块添加三个新字段：客户资料整理费、整理费开始日期、整理费结束日期
  - **数据库字段**：
    - `customerDataOrganizationFee`：客户资料整理费（DECIMAL(10,2)）
    - `organizationStartDate`：整理费开始日期（DATE）
    - `organizationEndDate`：整理费结束日期（DATE）
  - **字段位置**：新字段位于 `statisticalEndDate` 字段之后，保持数据表结构的逻辑顺序
  - **功能覆盖**：
    - 更新费用实体（Expense Entity）：添加新字段的数据库映射定义
    - 更新创建费用DTO：添加新字段的验证和API文档
    - 更新CSV导出功能：在导出映射中添加新字段的中文列名
    - 更新收据查看接口：在 `/api/expense/receipt` 接口中添加客户资料整理费显示
    - 提供数据库迁移脚本：`database/migrations/2025-09-30-add-customer-data-organization-fields.sql`
  - **技术实现**：
    - TypeORM实体字段定义完整，包含类型、精度、注释等
    - DTO验证使用 `@IsOptional()` 和 `@IsNumber()/@IsString()` 装饰器
    - CSV导出字段映射按逻辑顺序排列，便于数据分析
  - **向后兼容**：所有新字段均为可选字段，不影响现有功能的正常使用

### 2025-09-15
- **群组管理模块新增**：
  - 新增完整的群组管理模块，支持企业微信群组信息管理
  - 实现群组的CRUD操作：创建、查询、更新、删除
  - 支持群成员信息跟踪，包含员工和客户类型区分
  - 群消息记录功能，分别记录最后消息、员工消息、客户消息
  - 群提醒级别管理，支持不同级别的提醒设置
  - 数据库表时间戳优化，支持自动创建和更新时间
  - 完整的TypeORM实体定义和DTO验证
  - Swagger API文档集成

### 2025-01-17
- **费用管理模块socialInsuranceBusinessType多选参数功能**：
  - 为 `/api/expense` 接口的 GET 请求添加 `socialInsuranceBusinessType` 参数，支持多选功能
  - **技术实现**：与 `businessType` 参数保持一致的多选支持
    - 修改查询DTO和导出DTO，添加 `socialInsuranceBusinessType` 字段，类型为 `string | string[]`
    - 在费用服务的查询和导出功能中实现复杂的OR条件查询逻辑
    - 支持数组和单值两种格式，正确处理空值、null值和undefined值的查询条件
    - 在控制器中添加详细的API文档说明，包含多选使用示例
  - **使用方式**：
    - 单个值：`socialInsuranceBusinessType=新增`
    - 多个值：`socialInsuranceBusinessType=新增&socialInsuranceBusinessType=续费`
    - 支持与空值混合查询，能正确匹配数据库中的NULL或空字符串字段
  - **向后兼容**：新增功能不影响现有使用方式，与费用管理模块现有的多选查询功能保持一致
  - **完整覆盖**：查询接口、导出接口、Swagger文档均已完整支持多选功能

### 2025-01-17
- **费用导出字段映射优化**：
  - 修改费用导出CSV接口 `/api/expense/export/csv` 的字段映射名称
  - **字段映射更新**：
    - `otherBusiness`: `其他业务（自有）` → `其他业务(基础)`
    - `otherBusinessFee`: `其他业务收费（自有）` → `其他业务收费(基础)`
    - `otherBusinessOutsourcing`: `其他业务（外包）` → `其他业务`
    - `otherBusinessOutsourcingFee`: `其他业务收费（外包）` → `其他业务收费`
  - **新增字段映射**：
    - `otherBusinessSpecial`: `其他业务(特殊)`
    - `otherBusinessSpecialFee`: `其他业务收费(特殊)`
  - **数据处理优化**：为新增的 `otherBusinessSpecial` 字段添加数组字符串处理逻辑
  - **向后兼容**：保持原有导出功能完全兼容，仅调整字段标题显示

### 2025-01-17
- **客户管理接口多选参数功能**：
  - 为 `/api/customer` 接口的5个字段实现多选支持，与 `/api/expense` 接口中 `businessType` 字段的多选功能保持一致
  - **支持多选的字段**：
    - `enterpriseType`：企业类型，支持多选查询
    - `customerLevel`：客户分级，支持多选查询  
    - `location`：归属地，支持多选查询
    - `enterpriseStatus`：企业当前的经营状态，支持多选查询
    - `businessStatus`：当前业务的状态，支持多选查询
  - **技术实现**：
    - 修改查询DTO和导出DTO，字段类型从 `string` 改为 `string | string[]`
    - 在服务层实现复杂的OR条件查询逻辑，支持数组和单值两种格式
    - 正确处理空值、null值和undefined值的查询条件
    - 为查询和导出功能同时实现多选支持
    - 在控制器中添加详细的API文档说明，包含多选使用示例
  - **使用方式**：
    - 单个值：`enterpriseType=有限责任公司`
    - 多个值：`enterpriseType=有限责任公司&enterpriseType=股份有限公司`
    - 支持与空值混合查询，能正确匹配数据库中的NULL或空字符串字段
  - **向后兼容**：保持原有单选功能完全兼容，新增的多选功能不影响现有使用方式
  - **完整覆盖**：查询接口、导出接口、Swagger文档均已完整支持多选功能

### 2025-01-17
- **考勤扣款导入员工姓名对比功能优化**：
  - 为考勤扣款导入接口 `POST /api/attendance-deduction/import` 优化员工姓名对比功能
  - **智能过滤导入**：改进导入逻辑，允许导入匹配的员工数据，自动跳过不匹配的员工
  - **对比逻辑**：导入前自动对比导入文件中的姓名与 `sys_employees` 表中在职员工姓名
  - **灵活处理策略**：
    - 对于导入文件中存在但员工表中不存在的员工：**自动跳过**，不阻止整个导入流程
    - 对于员工表中存在但导入文件中缺失的员工：**仅提醒**，不影响导入
    - 只有当导入文件中所有员工都不存在于员工表时才完全拒绝导入
  - **用户体验优化**：
    - 支持部分导入，提高工作效率
    - 提供详细的跳过和成功统计信息
    - 返回具体的不匹配员工姓名列表，便于用户了解处理结果
  - **在职员工筛选**：只对比在职员工（`isResigned = false` 或 `NULL`），离职员工不参与对比
  - **技术实现**：
    - Python脚本中实现智能过滤逻辑，过滤掉无效员工后继续处理
    - API响应格式增强，包含 `warning`、`name_mismatch_details` 等详细信息
    - 支持成功导入时同时返回警告信息
  - **API响应优化**：
    - 成功响应包含跳过员工的详细信息
    - 新增 `warning` 字段提示部分员工被跳过
    - 保持向后兼容，支持完全匹配和部分匹配两种场景

### 2025-01-17
- **薪资管理接口数值字段范围筛选功能**：
  - 为薪资管理接口添加所有数值字段的范围筛选参数支持
  - 影响接口：
    - `GET /api/salary/admin` - 管理员获取薪资列表接口
    - `GET /api/salary/export/csv` - 导出薪资数据为CSV接口
  - 新增筛选字段（每个字段支持最小值和最大值范围筛选）：
    - `baseSalary` - 基本工资
    - `attendanceDeduction` - 考勤扣款
    - `temporaryIncrease` - 临时增加
    - `fullAttendance` - 全勤奖
    - `departmentHeadSubsidy` - 部门主管补贴
    - `positionAllowance` - 职务津贴
    - `oilSubsidy` - 油费补贴
    - `mealSubsidy` - 餐费补贴
    - `seniority` - 工龄工资
    - `agencyFeeCommission` - 代理费提成
    - `performanceCommission` - 绩效提成
    - `businessCommission` - 业务提成
    - `otherDeductions` - 其他扣款
    - `personalInsuranceTotal` - 个人保险合计
    - `companyInsuranceTotal` - 公司保险合计
    - `depositDeduction` - 押金扣款
    - `personalIncomeTax` - 个人所得税
    - `totalPayable` - 应付合计
    - `bankCardOrWechat` - 银行卡/微信
    - `cashPaid` - 现金发放
    - `corporatePayment` - 企业代付
    - `taxDeclaration` - 税务申报
  - 参数格式：每个字段支持 `字段名Min` 和 `字段名Max` 两个参数
  - 更新相关DTO：
    - `QuerySalaryDto`：添加所有数值字段的最小值和最大值参数定义
    - `ExportSalaryDto`：添加所有数值字段的最小值和最大值参数定义
  - 更新后端查询逻辑：
    - `SalaryService.findAll()` 方法：添加数值字段范围查询条件
    - `SalaryService.exportToCsv()` 方法：添加数值字段范围查询条件
  - 完整的Swagger API文档：为每个范围筛选参数添加详细的 `@ApiQuery` 说明
  - 支持灵活的数值范围查询，提升薪资数据筛选和分析能力

### 2025-01-17
- **薪资管理接口筛选参数优化**：
  - 删除薪资管理接口中的 `idCard`（身份证号）和 `company`（公司）筛选参数
  - 影响接口：
    - `GET /api/salary/admin` - 管理员获取薪资列表接口
    - `GET /api/salary/export/csv` - 导出薪资数据为CSV接口
  - 更新相关DTO：
    - `QuerySalaryDto`：删除 `idCard` 字段定义和验证器
    - `ExportSalaryDto`：删除 `idCard` 和 `company` 字段定义和验证器
  - 更新后端查询逻辑：
    - `SalaryService.findAll()` 方法：删除对 `idCard` 字段的查询条件
    - `SalaryService.exportToCsv()` 方法：删除对 `idCard` 和 `company` 字段的查询条件
  - 同步更新Swagger API文档：删除对应的 `@ApiQuery` 参数说明
  - 简化筛选条件，提升接口性能和用户体验

### 2025-01-17
- **薪资密码重置功能**：
  - 新增管理员薪资密码重置接口 `PATCH /api/auth/salary/reset-password/{userId}`
  - 支持清空用户的薪资密码和更新时间字段，实现完全重置
  - 用户可通过现有的 `/api/auth/salary/set-password` 接口重新设置薪资密码
  - 严格的权限控制：仅 `super_admin` 和 `admin` 角色可执行重置操作
  - 完整的操作审计：返回操作员和目标用户信息，便于追踪和审计
  - 优化 `UsersService.updateSalaryPassword` 方法，支持null值用于重置操作
  - 更新API文档，明确重置后重新设置密码的流程说明

### 2025-01-17
- **凭证存放记录年度查询功能增强**：
  - 为 `/api/voucher-record/years` 接口添加 `companyName` 参数支持
  - 支持按企业名称进行模糊查询，通过关联的客户表 `customer.companyName` 字段实现
  - 查询参数说明：`companyName` - 企业名称关键词，支持模糊匹配
  - 使用示例：`GET /api/voucher-record/years?companyName=阿里巴巴&page=1&limit=10`
  - 注意：虽然 `voucher_record_years` 表中没有 `companyName` 字段，但通过 `customer_id` 关联客户表实现企业名称查询

### 2025-01-17
- **员工删除级联删除薪资数据功能**：
  - **功能概述**：实现员工删除时自动删除该员工所有相关薪资数据的功能，确保数据一致性
  - **涉及数据表**：删除员工时会自动清理7个薪资相关数据表（薪资记录、社保信息、补贴合计、考勤扣款、朋友圈扣款、保证金记录、薪资基数历史）
  - **技术实现**：在业务逻辑层面实现级联删除，使用数据库事务确保操作的原子性和一致性
  - **安全机制**：提供详细的删除日志、错误处理和恢复策略，支持配置删除失败时的处理方式
  - **扩展性**：架构设计支持将来添加新的薪资相关数据表，只需要简单配置即可自动纳入级联删除范围
  - **使用场景**：当员工离职或数据清理时，一键删除员工信息及其所有薪资相关数据，避免数据冗余和不一致
  - **详细文档**：参见 `CASCADE_DELETE_README.md` 文件了解完整的功能说明和使用指南

- **客户等级分布接口优化**：
  - **返回结构调整**：将返回体details中的level字段移到customers数组中，每个客户对象现在直接包含level字段
  - **分页逻辑优化**：分页参数现在应用到客户详情列表（details）而不是等级分布统计
  - **新增level筛选参数**：支持按客户等级进行筛选，如 `level=AA`
  - **响应结构重构**：
    - `list`：客户详情列表（分页），包含customerId、companyName、unifiedSocialCreditCode、contributionAmount、level字段
    - `levelStats`：等级统计信息（不分页），包含各等级的count、percentage、revenue统计
    - `summary`：汇总信息保持不变
  - **API兼容性**：保持原有查询参数的兼容性，新增level筛选参数为可选

### 2025-01-15
- **新增客户统计接口日期范围修复**：
  - **问题描述**：修复新增客户统计接口在按年月查询时，无法统计到月末最后一天客户的问题
  - **根本原因**：原代码使用 `BETWEEN` 操作符且 `endDate` 设置为月末第一秒（00:00:00），导致月末当天其他时间创建的客户被遗漏
  - **修复方案**：
    - 将查询条件从 `BETWEEN` 改为 `>= AND <` 的组合
    - 调整日期范围计算：`endDate` 使用下个月第一天，确保包含当月所有时间
    - 对于 `startDate` 和 `endDate` 参数查询，确保 `endDate` 包含整天（23:59:59.999）
  - **影响接口**：`GET /api/reports/new-customer-stats`
  - **修复效果**：现在可以正确统计到月末最后一天的所有客户记录
  - **技术改进**：
    - 按年月查询：`endDate = new Date(year, month, 1)` （下个月第一天）
    - 按年查询：`endDate = new Date(year + 1, 0, 1)` （下一年第一天）
    - 日期范围查询：`endDate.setHours(23, 59, 59, 999)` （包含整天）
    - 查询条件：`createTime >= startDate AND createTime < endDate`

### 2025-01-15
- **历史数据表changeDate字段类型优化**：
  - **问题解决**：将 `customer_status_history` 和 `customer_level_history` 表中的 `changeDate` 字段从 `DATE` 类型修改为 `DATETIME` 类型
  - **修改目的**：支持时分秒精度，解决统计时无法精确找出分组后每组 `changeDate` 字段最大值数据的问题
  - **业务影响**：
    - 客户流失统计现在可以精确找出每个公司状态变更的最新记录
    - 客户等级分布统计可以准确确定客户在特定时间点的等级状态
    - 解决了同一天多次状态变更时无法确定最新状态的问题
  - **技术改进**：
    - TypeORM 实体类字段类型：`type: 'date'` → `type: 'datetime'`
    - API 接口支持 ISO 8601 日期时间格式：`2025-01-15T10:30:00Z`
    - 重建数据库索引以确保查询性能
    - 向后兼容：仍支持只传入日期部分，系统会自动补充时间为 `00:00:00`
  - **文档更新**：创建详细的迁移说明文档 `docs/CHANGEDATE_DATETIME_MIGRATION.md`
  - **数据库迁移**：提供完整的 SQL 迁移脚本 `database/migrations/2025-01-15-modify-changedate-to-datetime.sql`

- **代理费收费变化分析接口完善**：
  - ✅ **接口实现完成**：代理费收费变化分析接口已完全实现并可正常使用
  - ✅ **权限控制系统**：实现基于费用数据权限的访问控制系统
    - `expense_data_view_all`：查看所有费用数据（管理员权限）
    - `expense_data_view_by_location`：按区域查看费用数据（分公司负责人权限）
    - `expense_data_view_own`：查看自己提交的费用数据（普通业务员权限）
  - ✅ **数据过滤逻辑**：权限过滤逻辑与费用管理模块保持一致，确保数据访问的统一性和安全性
  - ✅ **缓存机制**：支持30分钟Redis风格缓存，提升查询性能
  - ✅ **分页支持**：完整的分页查询功能，支持自定义页码和页面大小
  - ✅ **汇总统计**：提供总客户数、受影响客户数、总减少金额、平均减少金额等统计信息
  - ✅ **完整文档**：创建详细的API文档（`AGENCY_FEE_ANALYSIS_API.md`）和测试脚本
  - ✅ **模块集成**：已在主应用模块中正确注册，所有依赖项配置完成

- **报表分析模块新增**：
  - 新增完整的报表分析模块，提供多维度业务数据分析功能
  - 实现7种核心报表类型：代理费收费变化分析、新增客户统计、员工业绩统计、客户等级分布、客户流失统计、代理服务到期统计、会计负责客户数量统计
  - 集成智能缓存系统，支持用户级和全局缓存，显著提升查询性能
  - 支持Excel导出功能，使用exceljs库生成专业格式的报表文件
  - 基于角色的权限控制，确保敏感报表数据的安全访问
  - 数据库索引优化，为客户表和费用表添加专门的查询索引
  - 完整的Swagger API文档和权限配置
  - 报表缓存实体(ReportCache)集成到主应用模块
  - 提供缓存管理接口，支持清除指定类型或全部报表缓存
  - 新增exceljs依赖包，支持专业级Excel文件生成和导出
  - 完善报表模块权限配置，为所有角色分配全部报表访问权限（后续可根据需要调整）

### 2025-01-15
- **账务自查模块字段扩展**：
  - **新增问题图片描述字段**：为账务自查表(`sys_financial_self_inspection`)添加 `problemImageDescription` 字段
  - **字段规格**：VARCHAR(500)类型，可为NULL，用于存储问题的图片描述信息
  - **功能增强**：
    - 所有查询接口(`my-submitted`、`my-responsible`、`my-reviewed`)均支持按问题图片描述进行模糊搜索
    - 创建和更新DTO中添加问题图片描述字段的验证和文档
    - 查询DTO中添加问题图片描述的筛选参数
  - **数据库更新**：
    - 提供完整的SQL迁移脚本：`database/migrations/2025-01-15-add-problem-image-description.sql`
    - 字段位置：在`problem`字段之后添加，保持表结构的逻辑顺序
    - 字段验证：包含字段添加成功的验证查询和表结构展示
  - **API影响**：
    - `POST /api/enterprise-service/financial-self-inspection`：支持problemImageDescription字段
    - `GET /api/enterprise-service/financial-self-inspection/my-*`：所有查询接口支持按问题图片描述筛选
    - 向后兼容：现有功能不受影响，新字段为可选字段

### 2025-01-15
- **凭证存放记录模块重要变更**：
  - **状态字段类型变更**：将月度记录的 `status` 字段从枚举类型改为字符串类型
  - **前端自定义状态**：状态内容现在完全由前端定义，不再受后端枚举限制
  - **数据库结构调整**：`voucher_record_months` 表的 `status` 字段从 `enum` 改为 `varchar(50)`
  - **API 响应变更**：统计接口返回结构调整，使用 `statusCounts` 对象代替固定的枚举计数
  - **迁移脚本提供**：创建了 `migrate_voucher_status.sql` 脚本用于数据迁移
  - **文档全面更新**：更新所有示例和说明，状态值从英文枚举改为中文字符串
  - **权限配置修复**：修正权限服务中的权限名称与数据库中的权限名称匹配问题
    - 数据库权限名称：`voucher_record_action_*`（如：`voucher_record_action_view`）
    - 修正后代码正确查询对应的权限记录

### 2025-01-15
- **通知系统功能增强**：
  - 新增根据用户名发送通知功能
  - 创建通知DTO新增 `targetUserNames` 字段，支持传入用户名数组
  - 通知服务自动根据用户名查找对应用户ID并发送通知
  - 优化用户名查询逻辑，使用TypeORM的`In`操作符提高查询效率
  - 添加用户名未找到的警告日志，便于问题排查
  - 支持的请求格式：`{ "targetUserNames": ["张三", "李四", "王五"] }`

### 2025-01-15
- **宗族管理模块优化**：
  - **添加成员接口重构**：
    - 路由从 `POST /api/clan/{id}/members/{memberName}` 改为 `POST /api/clan/members`
    - 参数从路径参数改为请求体参数：`{ "id": 1, "memberName": "六六3" }`
    - 响应体返回宗族ID和成员姓名信息
    - 删除成员接口保持不变
  - **API接口简化**：删除重复的根据宗族名称查询接口（`GET /api/clan/name/{clanName}`），统一使用 `GET /api/clan` 接口
  - **查询功能增强**：新增 `exactMatch` 参数支持精确匹配查询，原有模糊查询功能保留
  - **接口统一性**：所有宗族查询需求统一通过一个接口实现，提升API设计的简洁性和一致性
  - **文档更新**：更新Swagger文档和README说明，明确新的查询参数和使用方法

- **宗族管理模块新增**：
  - 在客户管理模块下新增宗族管理功能
  - 创建宗族实体（Clan Entity）包含宗族名称、成员列表等字段
  - 实现完整的CRUD操作：创建、查询、更新、删除
  - 支持多条件查询：按宗族名称、成员姓名进行模糊匹配
  - 分页查询支持，默认每页10条记录
  - **统一查询接口**：合并分页查询和名称列表查询为单一接口，通过 `namesOnly` 参数控制返回格式
  - 完整的DTO验证和Swagger文档配置
  - 数据库表：`sys_clan`，包含id、clanName、memberList、createTime、updateTime字段
  - API路由：`/api/customer/clan`，支持GET、POST、PATCH、DELETE操作

### 2025-01-15
- **客户历史数据级联删除配置**：
  - 为客户等级历史表（`customer_level_history`）配置级联删除 (`onDelete: 'CASCADE'`)
  - 为客户状态历史表（`customer_status_history`）配置级联删除 (`onDelete: 'CASCADE'`)
  - 现在删除客户时，相关的等级变更历史和状态变更历史记录会自动删除
  - 解决了删除客户后留下孤立历史记录的数据完整性问题
  - 确保数据库关联数据的一致性和完整性

### 2025-01-14
- **费用管理模块businessType查询修复**：
  - 修复多选业务类型筛选时包含空值导致的查询错误问题
  - 优化businessType参数处理逻辑，正确处理数组中包含空值、null值的情况
  - 当多选参数中包含空值时，会正确匹配数据库中businessType为NULL或空字符串的记录
  - 解决了单项筛选正常但多项选择包含空值时查询失败的问题

### 2025-01-12
- **费用贡献接口优化**：
  - 为 `/api/enterprise-service/expense-contribution/find-company-expenses` 接口添加年份筛选功能
  - 新增 `year` 参数，支持按年份筛选企业费用记录
  - 通过 chargeDate 字段进行年份匹配，返回指定年份的费用明细和总金额
  - 使用示例：`GET /api/enterprise-service/expense-contribution/find-company-expenses?companyName=某某公司&year=2024`

### 2025-01-12
- **合同模块归属地功能**：
  - 为合同实体添加 `location` 归属地字段
  - 在创建合同DTO和查询合同DTO中添加归属地字段支持
  - 更新合同查询逻辑，支持按归属地进行模糊查询
  - 恢复合同权限服务中的归属地权限控制功能
  - 支持基于用户部门的归属地权限验证（`contract_data_view_by_location`权限）
  - 提供数据库迁移SQL脚本，为 `sys_contract` 表添加 `location` 字段

### 2024-12-30
- 放开佣金模块四个查询接口的权限限制：
  - `GET /api/commission/sales` - 查询业务提成表销售记录列表
  - `GET /api/commission/consultant` - 查询业务提成表顾问记录列表  
  - `GET /api/commission/other` - 查询业务提成表其他记录列表
  - `GET /api/commission/performance` - 查询绩效提成记录列表
  - 这四个接口现在可以公开访问，无需角色权限验证，方便前端系统查询佣金数据

### 客户等级分布报表排序问题修复

#### 问题描述
在客户等级分布报表中发现排序功能存在问题：
- 当指定 `sortField=contributionAmount&sortOrder=DESC` 时，返回结果中最大值为9920
- 当不指定排序参数时，返回结果中存在比9920更大的数据（如12000）
- 这表明排序逻辑存在不一致性

#### 根本原因分析

1. **缓存键不一致**：
   - 带排序参数的请求和不带排序参数的请求生成了不同的缓存键
   - 旧的缓存键生成逻辑过于简化，没有包含完整的权限信息
   - 导致不同的请求可能命中了错误的缓存数据

2. **数据类型转换问题**：
   - `contributionAmount` 字段在数据库中定义为 `decimal(15,2)` 类型
   - 从数据库返回时可能被当作字符串处理
   - 排序算法中的数字比较逻辑没有正确处理数字字符串

3. **查询参数规范化缺失**：
   - 不同的查询参数组合（有无排序字段）没有被规范化
   - 导致缓存键生成不一致

#### 解决方案

1. **优化缓存键生成逻辑**：
   ```typescript
   // 规范化查询参数，确保缓存键的一致性
   const normalizedQuery = {
     ...query,
     sortField: query.sortField || null, // 明确设置为null而不是undefined
     sortOrder: query.sortOrder || 'DESC', // 使用默认值
   };
   
   // 生成包含权限信息的缓存键
   const cacheKey = this.cacheService.generateCacheKey({
     ...normalizedQuery,
     userId: userId, // 使用具体的用户ID
     permissions: userPermissions.sort(), // 添加权限信息
     isAdmin: isAdmin, // 添加管理员标识
     userRoles: userRoles.sort() // 添加角色信息
   });
   ```

2. **修复数据类型转换**：
   ```typescript
   // 确保contributionAmount被正确转换为数字类型
   const result = customers.map(customer => ({
     customerId: customer.id,
     companyName: customer.companyName,
     unifiedSocialCreditCode: customer.unifiedSocialCreditCode,
     contributionAmount: parseFloat(customer.contributionAmount?.toString() || '0') || 0,
   }));
   ```

3. **增强排序算法**：
   ```typescript
   // 数字比较（包括数字字符串）
   const numA = typeof valueA === 'number' ? valueA : parseFloat(String(valueA));
   const numB = typeof valueB === 'number' ? valueB : parseFloat(String(valueB));
   
   if (!isNaN(numA) && !isNaN(numB)) {
     return sortOrder === 'ASC' ? numA - numB : numB - numA;
   }
   ```

4. **添加调试接口**：
   ```bash
   # 临时调试接口：清除指定用户的客户等级分布缓存
   DELETE /api/reports/customer-level-distribution/clear-cache/{userId}
   ```

#### 技术细节

- **权限感知缓存**：确保不同权限的用户获得不同的缓存数据
- **参数规范化**：统一处理有无排序参数的请求
- **类型安全**：确保数字字段被正确处理和比较
- **向后兼容**：修复不影响现有功能

#### 验证方法

1. 清除缓存后重新请求
2. 对比带排序参数和不带排序参数的结果
3. 验证 `contributionAmount` 字段的数值排序正确性
4. 确认权限变更后缓存自动更新

这个修复确保了报表排序功能的正确性和一致性，同时保持了系统的性能优势。

### 2025-01-18
- **考勤扣款导入时间限制功能**：
  - 为考勤扣款导入接口 `POST /api/attendance-deduction/import` 添加时间验证功能
  - **时间限制规则**：只允许导入上个月的数据，与朋友圈缴费导入接口保持一致
  - **验证机制**：
    - 在Python脚本中添加 `validate_date_range()` 函数，验证所有记录的年月字段
    - 如果发现不符合要求的记录，返回详细的错误信息和无效记录列表
    - 时间验证在数据处理之前执行，确保不会导入错误时间的数据
  - **错误处理**：
    - Python脚本返回结构化的错误信息（error_type: `invalid_date_range`）
    - TypeScript服务层正确解析和处理时间验证错误
    - Controller层返回友好的错误提示："只能导入上个月数据"
  - **技术实现**：
    - 使用 `dateutil.relativedelta` 计算上个月的年月
    - 支持字符串和日期对象两种日期格式的验证
    - 提供详细的无效记录信息，包括行号、实际日期和期望日期
  - **影响范围**：
    - 修改文件：`src/modules/salary/attendance-deduction/utils/import_deduction.py`
    - 修改文件：`src/modules/salary/attendance-deduction/attendance-deduction.service.ts`
    - 修改文件：`src/modules/salary/attendance-deduction/attendance-deduction.controller.ts`
  - **用户体验**：防止误导入错误月份的考勤扣款数据，确保数据的时效性和准确性
