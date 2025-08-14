# 第一阶段：基础依赖
FROM node:20-bullseye AS base

WORKDIR /usr/src/app

# 安装系统依赖（使用缓存挂载优化）
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip wget && \
    apt-get clean

# 设置npm和pnpm使用国内镜像（合并为单层）
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

# 复制Python依赖文件并使用缓存挂载安装
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip3 install --no-cache-dir \
    --timeout=1000 \
    --retries=5 \
    -i https://pypi.tuna.tsinghua.edu.cn/simple/ \
    --trusted-host pypi.tuna.tsinghua.edu.cn \
    -r requirements.txt

# 第二阶段：开发构建
FROM base AS development

# 复制依赖文件
COPY package*.json pnpm-lock.yaml ./

# 安装依赖（使用缓存挂载）
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/v3 \
    --mount=type=cache,target=/usr/src/app/node_modules \
    pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用（使用缓存挂载）
RUN --mount=type=cache,target=/usr/src/app/node_modules \
    pnpm run build

# 第三阶段：生产环境
FROM base AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# 创建非root用户和组
RUN groupadd -r nodeapp && \
    useradd -r -g nodeapp -d /usr/src/app nodeapp

# 复制package文件并安装生产依赖（使用缓存挂载）
COPY package*.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/v3 \
    pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# 从development阶段复制构建产物，直接设置所有者
COPY --from=development --chown=nodeapp:nodeapp /usr/src/app/dist ./dist

# 创建需要写入权限的目录并设置所有者
RUN mkdir -p /usr/src/app/uploads /usr/src/app/tmp /usr/src/app/logs && \
    chown nodeapp:nodeapp /usr/src/app/uploads /usr/src/app/tmp /usr/src/app/logs

# 复制应用文件，直接设置所有者
COPY --chown=nodeapp:nodeapp . .

# 切换到非root用户
USER nodeapp

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]