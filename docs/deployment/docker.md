# Docker部署指南

## 概述

本文档详细介绍如何使用Docker和Docker Compose部署中岳信息管理系统后端。

## Docker环境要求

- Docker 20.10+
- Docker Compose 2.0+

## Docker镜像说明

系统包含以下几个Docker镜像：

1. **API服务**: 基于Node.js的NestJS应用
2. **MySQL数据库**: 数据存储
3. **MinIO**: 对象存储服务
4. **Redis**: 缓存服务（可选）

## Docker Compose配置

以下是系统的`docker-compose.yml`文件示例：

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: zhongyue-api
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - db
      - minio
      - redis
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_DATABASE=${DB_DATABASE}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET=${MINIO_BUCKET}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  db:
    image: mysql:8.0
    container_name: zhongyue-db
    restart: always
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=${DB_DATABASE}
      - MYSQL_USER=${DB_USERNAME}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./backup:/backup

  minio:
    image: minio/minio
    container_name: zhongyue-minio
    restart: always
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"

  redis:
    image: redis:alpine
    container_name: zhongyue-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mysql-data:
  minio-data:
  redis-data:
```

## Dockerfile

以下是用于构建API服务的`Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
```

## 部署步骤

### 1. 准备环境变量

创建`.env`文件：

```bash
cp .env.example .env
```

编辑`.env`文件，设置正确的环境变量：

```
# 数据库配置
DB_USERNAME=zhongyue
DB_PASSWORD=secure_password
DB_DATABASE=zhongyue_db

# JWT配置
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=1d

# MinIO配置
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=zhongyue
```

### 2. 构建并启动容器

```bash
docker-compose up -d
```

这将构建API服务镜像并启动所有容器。

### 3. 初始化数据库

```bash
# 进入API容器
docker-compose exec api sh

# 运行数据库迁移
npm run migration:run

# 运行数据库种子
npm run seed:run

# 退出容器
exit
```

## 容器管理

### 查看容器状态

```bash
docker-compose ps
```

### 查看容器日志

```bash
# 查看API服务日志
docker-compose logs api

# 实时查看日志
docker-compose logs -f api

# 查看指定行数的日志
docker-compose logs --tail=100 api
```

### 重启服务

```bash
# 重启单个服务
docker-compose restart api

# 重启所有服务
docker-compose restart
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除卷（慎用，会删除所有数据）
docker-compose down -v
```

## 数据持久化

系统使用Docker卷来持久化数据：

- `mysql-data`: MySQL数据库文件
- `minio-data`: MinIO对象存储文件
- `redis-data`: Redis缓存数据
- `./logs`: 应用日志（映射到宿主机）
- `./uploads`: 上传文件临时存储（映射到宿主机）
- `./backup`: 数据库备份目录（映射到宿主机）

## 系统升级

### 1. 备份数据

```bash
# 备份数据库
docker-compose exec db sh -c 'mysqldump -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > /backup/backup_$(date +%Y%m%d).sql'
```

### 2. 拉取最新代码

```bash
git pull origin main
```

### 3. 重新构建并启动容器

```bash
docker-compose up -d --build
```

### 4. 运行数据库迁移

```bash
docker-compose exec api sh -c "npm run migration:run"
```

## 多环境配置

可以使用不同的Docker Compose配置文件来支持多环境部署：

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 测试环境
docker-compose -f docker-compose.test.yml up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 性能优化

### API服务优化

- 使用PM2进行进程管理
- 启用压缩和缓存
- 优化Node.js内存使用

### 数据库优化

- 配置MySQL缓存
- 优化查询和索引
- 设置合适的连接池大小

## 安全配置

- 设置强密码
- 限制容器网络访问
- 配置TLS/SSL
- 定期更新容器镜像 