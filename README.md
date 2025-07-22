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
│   ├── pipes/             # 管道
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
│   └── permissions/       # 权限管理
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

### 4. 部门管理模块 (department)
- 部门信息的CRUD操作
- 组织架构管理

### 5. 费用管理模块 (expense)
- 费用记录的CRUD操作
- 费用统计和报表

### 6. 合同管理模块 (contract)
- 合同信息管理
- 合同状态跟踪
- 合同签署功能
- 合同令牌系统：生成临时访问令牌用于未登录用户访问合同

### 7. 文件存储模块 (storage)
- 文件上传、下载、删除
- 支持JWT认证和合同令牌认证
- 基于MinIO的对象存储

### 8. 角色和权限模块 (roles, permissions)
- 基于RBAC的权限控制系统
- 角色管理
- 权限分配

### 9. 薪资管理模块 (salary)
- 薪资信息的CRUD操作
- 薪资基数历程管理（仅限管理员和超级管理员）
- 薪资自动生成功能
- 各种薪资相关组件（社保、补贴、考勤扣款等）
- 提成表管理（仅限管理员和超级管理员）

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

## 认证系统

系统支持两种认证方式：

### 1. JWT认证
- 用户登录后获取JWT令牌
- 所有API请求需要在请求头中携带令牌
- 令牌包含用户信息和权限

### 2. 合同令牌认证
- 为未登录用户提供临时访问特定资源的能力
- 主要用于合同签署和文件上传
- 令牌有效期默认为30分钟

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
