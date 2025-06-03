# 中岳信息管理系统后端

## 项目介绍

本项目是基于NestJS框架构建的信息管理系统后端，采用模块化设计，支持多个前端项目对接，包括React信息管理系统等。

## 技术栈

- **框架**: NestJS (基于Node.js的企业级框架)
- **语言**: TypeScript
- **数据库**: MySQL
- **ORM**: TypeORM
- **认证**: JWT (JSON Web Token)
- **存储**: MinIO (对象存储)
- **部署**: Docker (开发和生产环境)

## 项目结构

src/
├── app.module.ts # 主模块
├── main.ts # 入口文件
├── common/ # 通用模块
│ ├── constants/ # 常量定义
│ ├── decorators/ # 装饰器
│ ├── filters/ # 异常过滤器
│ ├── guards/ # 守卫
│ ├── interceptors/ # 拦截器
│ ├── interfaces/ # 接口定义
│ ├── middleware/ # 中间件
│ ├── pipes/ # 管道
│ └── utils/ # 工具函数
├── config/ # 配置模块
│ ├── app.config.ts # 应用配置
│ ├── database.config.ts # 数据库配置
│ ├── storage.config.ts # 存储配置
│ └── jwt.config.ts # JWT配置
├── modules/ # 业务模块
│ ├── auth/ # 认证模块
│ │ ├── dto/
│ │ ├── entities/
│ │ └── strategies/ # 认证策略
│ ├── users/ # 用户模块
│ │ ├── dto/
│ │ └── entities/
│ ├── storage/ # 文件存储模块
│ │ ├── storage.controller.ts # 控制器
│ │ └── storage.service.ts # 服务
│ └── [other-modules]/ # 其他业务模块
└── database/ # 数据库相关
└── migrations/ # 数据库迁移文件

## 开发环境

### 前置条件

- Node.js (v20.x)
- pnpm
- Docker & Docker Compose

### 安装依赖

```bash
pnpm install
```

### 开发环境启动

```bash
# 使用Docker运行开发环境
docker-compose up -d

# 直接在本地运行
pnpm run start:dev
```

## 生产环境部署

```bash
# 构建和启动生产环境容器
docker-compose -f docker-compose.prod.yml up -d
```

## API文档

项目启动后，可以访问 http://localhost:3000/api/docs 查看API文档（开发中）

### 文件存储API

- **上传文件**: POST /storage/upload
- **获取文件列表**: GET /storage/files
- **获取文件URL**: GET /storage/files/:fileName
  - 返回永久有效的文件访问URL，无过期时间
  - 系统自动配置了MinIO存储桶的公共读取策略，确保文件可通过URL长期访问
- **删除文件**: DELETE /storage/files/:fileName

### MinIO存储配置

MinIO服务配置了以下特性：
1. 存储桶具有公共读取权限，所有上传的文件可通过URL直接访问
2. 文件URL永久有效，无过期时间
3. 支持路径样式和子域名样式的URL格式

## 贡献指南

请遵循项目的代码风格和提交规范进行开发。

## 许可证

[MIT License](LICENSE)

## 功能模块

### 用户和认证模块
- 用户管理：创建、查询、更新和删除用户
- 认证功能：登录、注册、JWT令牌认证
- 角色和权限：基于RBAC的权限控制

### 客户管理模块
- 客户信息管理：添加、查询、更新和删除客户信息
- 客户分类和标签

### 部门管理模块
- 部门信息管理：添加、查询、更新和删除部门信息
- 组织架构管理

### 费用管理模块
- 费用记录：创建、查询、更新和删除费用记录
- 费用统计和报表

### 合同管理模块
- 合同信息管理：添加、查询、更新和删除合同信息
- 合同状态跟踪
- 合同签署功能
- 合同令牌系统：生成临时访问令牌用于未登录用户访问合同

### 文件存储模块
- 文件上传和下载
- MinIO对象存储集成
- 支持JWT认证和合同令牌认证

## API说明

### 合同令牌认证

系统支持两种认证方式：
1. JWT认证：用户登录后获取的令牌
2. 合同令牌认证：通过合同系统生成的临时令牌

#### 获取合同令牌

```
GET /api/contract-token?id=1234
```

返回结果：
```json
{
  "token": "a1b2c3d4...",
  "contractId": 1234,
  "expiredAt": "2023-05-01T12:34:56Z"
}
```

#### 使用合同令牌上传文件

合同令牌可以用于在未登录状态下上传文件，有以下几种使用方式：

1. 通过URL查询参数：
```
POST /api/storage/upload?token=a1b2c3d4...
```

2. 通过请求体：
```
POST /api/storage/upload
Content-Type: multipart/form-data
...
file: (二进制文件数据)
token: a1b2c3d4...
```

3. 通过请求头：
```
POST /api/storage/upload
Content-Type: multipart/form-data
contract-token: a1b2c3d4...
...
file: (二进制文件数据)
```

#### 令牌有效期

临时合同令牌的默认有效期为30分钟，系统会自动清理过期的令牌。

### 合同签名上传

系统提供了两种方式保存合同签名：

#### 1. 使用已有图片URL

```
POST /api/contract-token/signature
Content-Type: application/json

{
  "contractId": 1234,
  "token": "a1b2c3d4...",
  "signatureUrl": "https://example.com/signature.png"
}
```

#### 2. 直接上传签名图片文件

```
POST /api/contract-token/upload-signature
Content-Type: multipart/form-data

file: (二进制图片文件)
contractId: 1234
token: a1b2c3d4...
```

此接口会：
1. 上传图片到MinIO存储
2. 获取永久有效的图片URL
3. 将URL保存到合同的contractSignature字段
4. 更新合同状态为"已签署"
5. 删除合同相关的所有临时令牌

#### 签名上传后的结果

合同签名上传成功后，系统会：
1. 更新合同状态为"已签署"（contractStatus = '1'）
2. 删除所有与该合同相关的令牌，防止重复签署
3. 返回签名图片的永久访问URL

## 环境配置
- 开发环境: 支持热更新的Docker配置
- 生产环境: 优化的Docker生产配置
- 数据库: MySQL（已在Docker中部署）
