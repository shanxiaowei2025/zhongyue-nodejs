# AI 助手核心规则

Always respond in Chinese.

## 三阶段工作流

### 阶段一：分析问题

**声明格式**：`【分析问题】`

**必须做的事**：

- 深入理解需求本质
- 搜索所有相关代码
- 识别问题根因
- 发现架构问题
- 如果有不清楚的，请向我收集必要的信息
- 提供1~3个解决方案（如果方案与用户想达成的目标有冲突，则不应该成为一个方案）
- 评估每个方案的优劣

**融入的原则**：

- 系统性思维：看到具体问题时，思考整个系统
- 第一性原则：从功能本质出发，而不是现有代码
- DRY原则：发现重复代码必须指出
- 长远考虑：评估技术债务和维护成本

**绝对禁止**：

- ❌ 修改任何代码
- ❌ 急于给出解决方案
- ❌ 跳过搜索和理解步骤
- ❌ 不分析就推荐方案

### 阶段二：细化方案

**声明格式**：`【细化方案】`

**前置条件**：

- 用户明确选择了方案（如："用方案1"、"实现这个"）

**必须做的事**：

- 列出变更（新增、修改、删除）的文件，简要描述每个文件的变化

### 阶段三：执行方案

**声明格式**：`【执行方案】`

**必须做的事**：

- 严格按照选定方案实现
- 修改后运行代码格式化（pnpm format）、构建（pnpm build）

**绝对禁止**：

- ❌ 提交代码（除非用户明确要求）
- 启动开发服务器

## 🚨 阶段切换规则

1. **默认阶段**：收到新问题时，始终从【分析问题】开始
2. **切换条件**：只有用户明确指示时才能切换阶段
3. **禁止行为**：不允许在一次回复中同时进行两个阶段

## ⚠️ 每次回复前的强制检查

```
□ 我在回复开头声明了阶段吗？
□ 我的行为符合当前阶段吗？
□ 如果要切换阶段，用户同意了吗？
```

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `pnpm install` - Install dependencies
- `pnpm run start:dev` - Start development server with hot reload
- `pnpm run start:debug` - Start development server with debug mode
- `pnpm run build` - Build production bundle
- `pnpm run start:prod` - Start production server

### Testing

- `pnpm run test` - Run unit tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:cov` - Run tests with coverage report
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm run test:debug` - Run tests in debug mode

### Code Quality

- `pnpm run lint` - Run ESLint and fix issues
- `pnpm run format` - Format code with Prettier

### Documentation

- `pnpm run docs:dev` - Start VitePress docs in development mode
- `pnpm run docs:build` - Build documentation
- `pnpm run docs:preview` - Preview built documentation
- `pnpm run docs:serve` - Serve documentation with auto-open

### Docker Development

- `docker-compose up -d` - Start development environment
- `docker-compose -f docker-compose.prod.yml up -d` - Start production environment

## Project Architecture

This is a NestJS-based enterprise information management system with modular architecture:

### Core Structure

- **Framework**: NestJS with TypeScript
- **Database**: MySQL with TypeORM
- **Authentication**: JWT + Contract Token system
- **Storage**: MinIO object storage
- **Documentation**: VitePress + Swagger API docs

### Module Organization

The application follows a domain-driven modular design:

#### Authentication & Authorization (auth module)

- JWT-based user authentication
- Contract token system for non-authenticated access
- Role-based access control (RBAC)
- Combined authentication guard supporting both JWT and contract tokens

#### Core Business Modules

- **users**: User management with role assignment and departmental association
- **customer**: Customer information management with categorization
- **department**: Organizational structure management
- **roles/permissions**: RBAC implementation
- **expense**: Financial expense tracking and reporting
- **contract**: Contract management with digital signature capabilities
- **employee**: Employee information management
- **enterprise-service**: Comprehensive enterprise services including:
  - Service history tracking
  - Change history management
  - Financial self-inspection
  - Tax verification

#### Infrastructure Modules

- **storage**: File upload/download with MinIO integration
- **database**: TypeORM configuration and database management
- **config**: Centralized configuration management

### Key Architectural Patterns

#### Authentication Strategy

The system implements dual authentication:

1. **JWT Authentication**: Standard user login with bearer tokens
2. **Contract Token Authentication**: Temporary tokens for specific contract-related operations

#### Permission System

- Role-based permissions with granular access control
- Module-specific permission services (e.g., `customer-permission.service.ts`)
- Guard-based route protection

#### File Storage

- MinIO-based object storage with permanent URL generation
- Support for authenticated file uploads via both JWT and contract tokens
- Automatic filename timestamping for conflict resolution

#### Error Handling & Response Format

- Global exception filter (`http-exception.filter.ts`)
- Transform interceptor for consistent API responses
- Comprehensive validation using class-validator DTOs

## Important Development Notes

### Database Configuration

- Entity synchronization controlled by `DB_SYNCHRONIZE` environment variable
- Timezone set to UTC in TypeORM configuration
- All entities registered in `app.module.ts`

### Environment Configuration

Key environment variables (see `.env.example`):

- Database: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Application: `APP_PORT`, `APP_ENV`, `LOG_LEVEL`, `CORS_ORIGIN`
- MinIO: `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

### API Documentation

- Swagger UI available at `/api/docs` in non-production environments
- API prefix `/api` set globally
- Comprehensive DTO documentation with validation rules

### Logging System

- Custom logger extending ConsoleLogger
- File-based logging to `./logs/` directory with daily rotation
- Configurable log levels: error, warn, info, debug

### Development Workflow

1. Always run `pnpm run lint` before committing
2. Use `pnpm run test` to ensure tests pass
3. Follow the existing module structure when adding new features
4. Implement DTOs with proper validation for all endpoints
5. Add proper error handling and response transformation
