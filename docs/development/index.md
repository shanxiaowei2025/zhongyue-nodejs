# 开发指南

## 项目概述

中岳信息管理系统后端是基于NestJS框架构建的企业级应用，采用TypeScript编写，支持多种前端系统对接。项目采用模块化架构，便于维护和扩展。

## 技术栈

- **框架**: NestJS
- **语言**: TypeScript
- **数据库**: MySQL
- **ORM**: TypeORM
- **容器化**: Docker
- **API文档**: Swagger
- **存储**: MinIO
- **认证**: JWT

## 项目结构

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

## 开发流程

1. **克隆仓库**
2. **安装依赖**
3. **配置环境变量**
4. **启动开发环境**
5. **编写代码**
6. **提交代码**

详细开发流程请查看[开发流程](./workflow)页面。

## 环境配置

关于如何配置开发环境，请查看[环境配置](./environment)页面。

## 代码规范

关于代码规范和最佳实践，请查看[代码规范](./coding-standards)页面。 