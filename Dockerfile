FROM node:20-bullseye AS development

WORKDIR /usr/src/app

# 安装 Python 和 pip
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 设置npm和pnpm使用国内镜像
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

COPY package*.json pnpm-lock.yaml ./
COPY requirements.txt ./

RUN pnpm install
# 安装Python依赖
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

RUN pnpm run build

FROM node:20-bullseye AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# 安装Python和必要依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 设置国内镜像
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

COPY package*.json pnpm-lock.yaml ./
COPY requirements.txt ./

# 确保使用--prod标志
RUN pnpm install --prod && \
    pnpm store prune
# 安装Python依赖
RUN pip3 install --no-cache-dir -r requirements.txt

# 创建非root用户和组
RUN groupadd -r nodeapp && \
    useradd -r -g nodeapp -d /usr/src/app nodeapp

COPY --from=development /usr/src/app/dist ./dist

COPY . .
# 创建必要的目录
RUN mkdir -p /usr/src/app/uploads && \
    mkdir -p /usr/src/app/tmp && \
    mkdir -p /usr/src/app/logs

# 设置适当的权限
RUN chown -R nodeapp:nodeapp /usr/src/app/uploads /usr/src/app/tmp /usr/src/app/logs

# 切换到非root用户
USER nodeapp

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]
