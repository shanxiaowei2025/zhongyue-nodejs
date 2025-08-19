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
│   └── notifications/     # 通知系统（新增）
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

### 10. 薪资管理模块 (salary)
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
  - 考勤扣款导入：`POST /api/attendance-deduction/import`
  - 保证金导入：`POST /api/deposit/upload`
- **年月查询统一优化**：所有薪资模块支持 `yearMonth=2025-06` 格式的年月查询参数
- **薪资更新接口修复**：修复更新薪资记录时动态字段（`payrollCompany`、`depositTotal`）导致的数据库字段冲突问题
- **薪资DTO优化**：从 `UpdateSalaryDto` 中移除自动计算字段（`basicSalaryPayable`、`totalPayable`、`corporatePayment`、`taxDeclaration`），确保只有业务输入字段可以被修改，系统自动维护所有计算字段
- **薪资查询修复**：修复删除数据库中 `company` 字段后，代码中仍使用该字段查询导致的查询失败问题。已将相关代码注释并改用员工表中的 `payrollCompany` 字段
- **薪资自动更新修复**：修复 `salary-auto-update.service.ts` 中对已删除 `company` 字段的引用，消除TypeScript编译错误
- **员工状态同步功能**：新增员工从离职状态改为在职状态时，自动启用对应用户账号的功能，与原有的离职禁用用户账号功能形成完整闭环
- **薪资接口考勤备注功能**：为四个薪资接口（管理员列表、员工列表、管理员详情、员工详情）添加 `attendanceRemark` 字段，通过姓名和年月从 `sys_attendance_deduction` 表获取考勤备注信息

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
  
- 特殊模块权限：
  - 薪资基数历程：仅限`admin`和`super_admin`角色访问
  - 社保信息管理：仅限`admin`和`super_admin`角色访问
  - 补贴合计管理：仅限`admin`和`super_admin`角色访问
  - 考勤扣款管理：仅限`admin`和`super_admin`角色访问
  - 朋友圈扣款管理：仅限`admin`和`super_admin`角色访问
  - 提成表管理：仅限`admin`和`super_admin`角色访问（除提成比例查询接口外）

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

## 更新历史

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
