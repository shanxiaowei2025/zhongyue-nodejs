# 中岳信息管理系统 - Claude 开发文档

## 📋 项目概述

中岳信息管理系统是基于 **NestJS** 框架构建的企业级后端服务，采用 TypeScript 开发，支持多模块化架构设计。系统主要服务于企业内部管理需求，包括用户管理、客户管理、合同管理、薪资管理等核心业务功能。

## 🏗 项目架构

### 技术栈
```
- 框架: NestJS 10.x + TypeScript 5.x
- 数据库: MySQL 8.x + TypeORM 0.3.x
- 认证: JWT + RBAC权限控制
- 存储: MinIO对象存储
- 部署: Docker + Docker Compose
- 文档: Swagger/OpenAPI 3.0
- 实时通信: Socket.io
- 包管理: pnpm
```

### 目录结构
```
zhongyue-nodejs/
├── src/                          # 源代码目录
│   ├── app.module.ts            # 主应用模块
│   ├── main.ts                  # 应用入口文件
│   ├── common/                  # 通用组件
│   │   ├── constants/           # 常量定义
│   │   ├── decorators/          # 自定义装饰器
│   │   ├── filters/             # 异常过滤器
│   │   ├── guards/              # 守卫
│   │   ├── interceptors/        # 拦截器
│   │   ├── interfaces/          # 接口定义
│   │   ├── middleware/          # 中间件
│   │   └── utils/               # 工具函数
│   ├── config/                  # 配置模块
│   │   ├── app.config.ts        # 应用配置
│   │   ├── database.config.ts   # 数据库配置
│   │   ├── jwt.config.ts        # JWT配置
│   │   └── storage.config.ts    # 存储配置
│   ├── modules/                 # 业务模块
│   │   ├── auth/                # 认证模块
│   │   ├── users/               # 用户管理
│   │   ├── customer/            # 客户管理
│   │   ├── contract/            # 合同管理
│   │   ├── expense/             # 费用管理
│   │   ├── employee/            # 员工管理
│   │   ├── salary/              # 薪资管理
│   │   ├── attendance/          # 考勤管理
│   │   ├── department/          # 部门管理
│   │   ├── roles/               # 角色管理
│   │   ├── permissions/         # 权限管理
│   │   ├── storage/             # 文件存储
│   │   ├── notifications/       # 通知系统
│   │   └── enterprise-service/  # 企业服务
│   └── database/                # 数据库相关
│       └── migrations/          # 数据库迁移文件
├── docker-compose.yml           # 开发环境容器配置
├── docker-compose.prod.yml      # 生产环境容器配置
├── Dockerfile                   # 生产环境镜像
├── Dockerfile.dev              # 开发环境镜像
├── package.json                # 项目依赖配置
├── requirements.txt            # Python依赖
├── .env                        # 环境变量配置
└── logs/                       # 日志文件目录
```

### 模块架构设计

#### 核心模块分层
```
┌─────────────────────────────────────────┐
│              Controller Layer            │  ← HTTP请求处理
├─────────────────────────────────────────┤
│               Service Layer              │  ← 业务逻辑处理
├─────────────────────────────────────────┤
│              Repository Layer            │  ← 数据访问层
├─────────────────────────────────────────┤
│               Entity Layer               │  ← 数据模型定义
└─────────────────────────────────────────┘
```

#### 认证权限架构
```
JWT认证 ──┐
          ├── CombinedAuthGuard ──> 路由保护
合同令牌 ──┤
          └── 薪资二级密码
                    │
                    ↓
              RolesGuard ──> 角色权限控制
                    │
                    ↓
            具体权限验证 ──> 数据范围控制
```

## 🚀 开发环境配置

### 前置条件
```bash
# 必需软件版本
- Node.js: v20.x
- pnpm: latest
- Docker: v20.x+
- Docker Compose: v2.x+
- MySQL: v8.x (或通过Docker运行)
```

### 环境变量配置
创建 `.env` 文件：
```bash
# 应用配置
APP_PORT=3000
APP_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=*

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=zhongyue
DB_PASSWORD=your_password
DB_DATABASE=zhongyue_nodejs
DB_SYNCHRONIZE=true
DB_LOGGING=false

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
SALARY_JWT_SECRET=your_salary_jwt_secret

# MinIO配置
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=zhongyue
MINIO_PATH_STYLE=true

# 企业微信配置
CORPID=your_corp_id
CORPSECRETA=your_corp_secret_a
CORPSECRETB=your_corp_secret_b
```

### 快速启动
```bash
# 1. 克隆项目
git clone <repository-url>
cd zhongyue-nodejs

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库等信息

# 4. 启动开发环境 (推荐使用Docker)
docker-compose up -d

# 或者本地直接运行
pnpm run start:dev
```

## 📝 常用命令

### 开发命令
```bash
# 开发模式启动 (热重载)
pnpm run start:dev

# 调试模式启动
pnpm run start:debug

# 构建项目
pnpm run build

# 生产模式启动
pnpm run start:prod
```

### Docker命令
```bash
# 启动开发环境
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f api

# 停止服务
docker-compose down

# 重新构建镜像
docker-compose build --no-cache

# 生产环境部署
docker-compose -f docker-compose.prod.yml up -d
```

### 代码质量命令
```bash
# 代码格式化
pnpm run format

# 代码检查
pnpm run lint

# 自动修复lint问题
pnpm run lint --fix

# 运行测试
pnpm run test

# 运行测试并生成覆盖率报告
pnpm run test:cov

# 端到端测试
pnpm run test:e2e
```

### 数据库命令
```bash
# TypeORM CLI命令需要在容器内执行
docker-compose exec api bash

# 生成迁移文件
npx typeorm migration:generate -n MigrationName

# 运行迁移
npx typeorm migration:run

# 回滚迁移
npx typeorm migration:revert
```

## 📐 代码规范

### 文件命名规范
```
# 文件命名使用kebab-case
user-management.service.ts
auth.controller.ts
create-user.dto.ts
user.entity.ts

# 类命名使用PascalCase
class UserManagementService {}
class AuthController {}
class CreateUserDto {}
class User {}
```

### 目录结构规范
```
modules/
└── module-name/
    ├── dto/                    # 数据传输对象
    │   ├── create-entity.dto.ts
    │   ├── update-entity.dto.ts
    │   └── query-entity.dto.ts
    ├── entities/               # 实体定义
    │   └── entity.entity.ts
    ├── guards/                 # 模块特定守卫
    ├── interfaces/             # 接口定义
    ├── services/               # 业务逻辑服务
    ├── entity.controller.ts    # 控制器
    ├── entity.service.ts       # 主服务
    └── entity.module.ts        # 模块定义
```

### TypeScript 编码规范

#### 1. 类型定义
```typescript
// ✅ 推荐：明确的类型定义
interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  departmentId?: number;
}

// ✅ 推荐：使用泛型
class ApiResponse<T> {
  data: T;
  code: number;
  message: string;
}

// ❌ 避免：使用any类型
const userData: any = {};
```

#### 2. 装饰器使用
```typescript
// ✅ Controller规范
@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('用户管理')
export class UsersController {
  
  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

#### 3. DTO验证规范
```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsString()
  @MinLength(2)
  username: string;

  @ApiProperty({ description: '邮箱', example: 'zhangsan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '部门ID', required: false })
  @IsOptional()
  departmentId?: number;
}
```

#### 4. 服务类规范
```typescript
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.userRepository.create(createUserDto);
      const savedUser = await this.userRepository.save(user);
      
      this.logger.log(`用户创建成功: ${savedUser.username}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`用户创建失败: ${error.message}`);
      throw new BadRequestException('用户创建失败');
    }
  }
}
```

### 错误处理规范
```typescript
// ✅ 统一错误处理
try {
  const result = await this.someService.doSomething();
  return result;
} catch (error) {
  this.logger.error(`操作失败: ${error.message}`, error.stack);
  
  if (error instanceof ValidationError) {
    throw new BadRequestException('数据验证失败');
  }
  
  throw new InternalServerErrorException('服务器内部错误');
}
```

### 数据库操作规范
```typescript
// ✅ 使用事务处理复杂操作
async transferMoney(fromUserId: number, toUserId: number, amount: number) {
  return await this.dataSource.transaction(async manager => {
    await manager.decrement(User, { id: fromUserId }, 'balance', amount);
    await manager.increment(User, { id: toUserId }, 'balance', amount);
    
    // 记录转账日志
    await manager.save(TransferLog, {
      fromUserId,
      toUserId,
      amount,
      timestamp: new Date(),
    });
  });
}
```

## 🔧 开发工具配置

### VSCode 推荐插件
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-docker"
  ]
}
```

### VSCode 工作区配置
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

## 🐛 调试指南

### 本地调试
```bash
# 1. 启动调试模式
pnpm run start:debug

# 2. VSCode调试配置 (.vscode/launch.json)
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJS",
  "port": 9229,
  "restart": true,
  "stopOnEntry": false,
  "protocol": "inspector"
}
```

### Docker环境调试
```bash
# 修改 docker-compose.yml 添加调试端口
services:
  api:
    command: npm run start:debug
    ports:
      - "3000:3000"
      - "9229:9229"  # 调试端口
```

### 日志调试
```typescript
// 使用结构化日志
this.logger.log('用户登录', { 
  userId: user.id, 
  username: user.username,
  timestamp: new Date().toISOString()
});

// 日志级别
this.logger.error('错误信息');
this.logger.warn('警告信息');
this.logger.log('普通信息');
this.logger.debug('调试信息');
```

## 📚 API文档

### Swagger访问
```
开发环境: http://localhost:3000/api/docs
```

### API设计规范
```typescript
// RESTful API设计
GET    /api/users          # 获取用户列表
GET    /api/users/:id      # 获取单个用户
POST   /api/users          # 创建用户
PUT    /api/users/:id      # 更新用户
DELETE /api/users/:id      # 删除用户

// 批量操作
POST   /api/users/bulk-delete  # 批量删除
POST   /api/users/bulk-update  # 批量更新
```

## 🔒 安全最佳实践

### 1. 认证安全
```typescript
// JWT密钥管理
JWT_SECRET=使用强随机字符串，生产环境必须更换
JWT_EXPIRES_IN=合理设置过期时间，如24h

// 密码安全
const hashedPassword = await bcrypt.hash(password, 12);
```

### 2. 数据验证
```typescript
// 输入验证
@IsString()
@MinLength(2)
@MaxLength(50)
@Matches(/^[a-zA-Z0-9_]+$/)
username: string;
```

### 3. 权限控制
```typescript
// 细粒度权限控制
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@RequirePermissions('user_management_create')
```

## 📊 性能优化

### 1. 数据库优化
```typescript
// 使用索引
@Entity()
export class User {
  @Index()
  @Column()
  email: string;

  @Index(['departmentId', 'isActive'])
  @Column()
  departmentId: number;
}

// 查询优化
const users = await this.userRepository.find({
  select: ['id', 'username', 'email'], // 只选择需要的字段
  relations: ['department'], // 预加载关联
  where: { isActive: true },
  take: 10, // 限制结果数量
  skip: offset, // 分页
});
```

### 2. 缓存策略
```typescript
// Redis缓存示例
@Injectable()
export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redisClient.setex(key, ttl, JSON.stringify(value));
  }
}
```

## 🚀 部署指南

### 生产环境部署
```bash
# 1. 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 2. 启动生产服务
docker-compose -f docker-compose.prod.yml up -d

# 3. 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 环境变量管理
```bash
# 生产环境必须修改的配置
NODE_ENV=production
JWT_SECRET=生产环境强密钥
DB_PASSWORD=生产数据库密码
MINIO_ACCESS_KEY=生产MinIO密钥
MINIO_SECRET_KEY=生产MinIO秘钥
```

## 🔍 故障排查

### 常见问题

#### 1. 数据库连接问题
```bash
# 检查数据库连接
docker-compose exec api npm run typeorm -- query "SELECT 1"

# 检查环境变量
docker-compose exec api printenv | grep DB_
```

#### 2. 权限问题
```bash
# 检查文件权限
docker-compose exec api ls -la /usr/src/app/

# 修复权限
docker-compose exec api chown -R node:node /usr/src/app/
```

#### 3. 内存问题
```bash
# 监控容器资源使用
docker stats

# 调整内存限制
services:
  api:
    mem_limit: 1g
```

## 📞 支持与联系

如有问题或需要支持，请：
1. 查看项目 README.md
2. 检查 API 文档
3. 查看日志文件
4. 联系项目维护团队

---

**最后更新**: 2025-01-14
**文档版本**: v1.0.0
