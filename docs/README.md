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
│   └── jwt.config.ts      # JWT配置
├── database/              # 数据库相关
│   └── migrations/        # 数据库迁移脚本
└── modules/               # 业务模块
    ├── auth/              # 认证模块
    ├── users/             # 用户模块
    ├── department/        # 部门模块
    ├── customer/          # 客户模块
    ├── contract/          # 合同模块
    ├── expense/           # 费用模块
    ├── storage/           # 文件存储模块
    ├── roles/             # 角色模块
    └── permissions/       # 权限模块
```

## 核心功能模块

系统包含8个主要功能模块：

1. **认证模块**：提供JWT认证和合同令牌认证两种机制
2. **用户管理**：用户创建、查询、修改和删除
3. **客户管理**：客户信息的维护和管理
4. **部门管理**：组织架构管理
5. **费用管理**：费用记录与统计
6. **合同管理**：合同信息管理与关联查询
7. **文件存储**：基于MinIO的对象存储解决方案
8. **角色和权限**：基于RBAC的权限控制系统

## 技术架构图

```
+------------------+          +------------------+
|                  |          |                  |
|  React前端应用   |  <-----> |  NestJS后端API   |
|                  |          |                  |
+------------------+          +--------+---------+
                                       |
                                       v
                            +----------+----------+
                            |                     |
                            |  MySQL数据库服务    |
                            |                     |
                            +---------------------+
                                       ^
                                       |
                            +----------+----------+
                            |                     |
                            |  MinIO对象存储服务  |
                            |                     |
                            +---------------------+
```

## 文档导航

- [开发指南](development/README.md) - 项目开发相关文档
- [API文档](api/README.md) - 详细API接口说明
- [数据库设计](database/README.md) - 数据库结构与关系
- [部署指南](deployment/README.md) - 环境部署说明