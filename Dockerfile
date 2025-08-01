# 第一阶段：基础依赖
FROM node:20-bullseye AS base

WORKDIR /usr/src/app

# 安装Python、pip和健康检查工具
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip wget && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 设置npm和pnpm使用国内镜像
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

# 复制Python依赖文件并安装
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# 第二阶段：开发构建
FROM base AS development

COPY package*.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm run build

# 第三阶段：生产环境
FROM base AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# 创建非root用户和组（在复制文件前）
RUN groupadd -r nodeapp && \
    useradd -r -g nodeapp -d /usr/src/app nodeapp

COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --prod && \
    pnpm store prune

# 从development阶段复制构建产物
COPY --from=development /usr/src/app/dist ./dist

# 复制应用文件
COPY . .

# 创建必要的目录并设置权限（一步完成）
RUN mkdir -p /usr/src/app/uploads /usr/src/app/tmp /usr/src/app/logs && \
    chown -R nodeapp:nodeapp /usr/src/app

# 切换到非root用户
USER nodeapp

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]