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
- **删除文件**: DELETE /storage/files/:fileName

## 贡献指南

请遵循项目的代码风格和提交规范进行开发。

## 许可证

[MIT License](LICENSE)
