 # 开发环境部署指南

本指南将帮助您在本地设置开发环境，以便进行中岳信息管理系统后端的开发工作。

## 环境要求

- Node.js >= 16.x
- Docker 与 Docker Compose
- Git

## 克隆项目

```bash
git clone https://github.com/您的用户名/zhongyue-nodejs.git
cd zhongyue-nodejs
```

## 安装依赖

```bash
npm install
```

## 配置环境变量

复制环境变量模板文件并根据需要修改：

```bash
cp .env.example .env
```

以下是关键的环境变量配置项：

```
# 应用配置
NODE_ENV=development
APP_PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=zhongyue
DB_USERNAME=root
DB_PASSWORD=yourpassword

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# MinIO配置
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=zhongyue
```

## 使用Docker启动开发环境

项目配置了Docker开发环境，包含MySQL和MinIO服务：

```bash
docker-compose -f docker-compose.dev.yml up -d
```

这将启动以下服务：
- MySQL数据库 (端口 3306)
- MinIO对象存储 (端口 9000，控制台 9001)

## 启动开发服务器

```bash
# 开发模式启动（带热重载）
npm run start:dev

# 或者使用调试模式
npm run start:debug
```

成功启动后，开发服务器将运行在 http://localhost:3000

## 访问API文档

启动服务后，可以通过以下地址访问Swagger API文档：

```
http://localhost:3000/api/docs
```

## 数据库迁移

初始化数据库或应用迁移：

```bash
# 生成迁移文件
npm run migration:generate -- -n MigrationName

# 运行迁移
npm run migration:run

# 回滚迁移
npm run migration:revert
```

## 常见问题

### MinIO连接问题

如果遇到MinIO连接问题，请确保：
1. MinIO容器正在运行 (`docker ps`)
2. 环境变量中的MinIO配置正确
3. 首次使用时，可能需要手动创建存储桶（bucket）

### 数据库连接问题

确保MySQL容器正在运行，并且能够从开发环境连接：

```bash
# 检查容器状态
docker ps | grep mysql

# 进入容器测试
docker exec -it mysql mysql -uroot -p
```

如果使用宿主机MySQL，确保已创建数据库并授予权限：

```sql
CREATE DATABASE zhongyue CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON zhongyue.* TO 'youruser'@'%';
FLUSH PRIVILEGES;
```