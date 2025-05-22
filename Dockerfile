FROM node:20-bullseye AS development

WORKDIR /usr/src/app

# 安装 Python 和 pip
RUN apt update && \
    apt install -y python3 python3-pip && \
    pip3 install --no-cache-dir pandas sqlalchemy pymysql openpyxl && \
    apt clean && rm -rf /var/lib/apt/lists/*

# 设置npm和pnpm使用国内镜像
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

COPY package*.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:20-bullseye AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# 安装Python和必要依赖
RUN apt update && \
    apt install -y python3 python3-pip && \
    pip3 install --no-cache-dir pandas sqlalchemy pymysql openpyxl && \
    apt clean && rm -rf /var/lib/apt/lists/*

# 设置国内镜像
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

COPY package*.json pnpm-lock.yaml ./

# 确保使用--prod标志
RUN pnpm install --prod && \
    pnpm store prune

# 创建非root用户提高安全性
RUN useradd -r -g 0 -d /usr/src/app nodeapp

COPY --from=development /usr/src/app/dist ./dist

# 创建必要的目录
RUN mkdir -p /usr/src/app/uploads && \
    mkdir -p /usr/src/app/tmp

# 设置适当的权限
RUN chown -R nodeapp:nodeapp /usr/src/app/uploads /usr/src/app/tmp

# 切换到非root用户
USER nodeapp

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]
