FROM node:20-alpine AS development

WORKDIR /usr/src/app

# 设置npm和pnpm使用国内镜像
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

COPY package*.json pnpm-lock.yaml ./

RUN npm install

COPY . .

RUN pnpm run build

FROM node:20.11-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json pnpm-lock.yaml ./

RUN npm install -g pnpm && \
    pnpm install --prod && \
    npm cache clean --force

# 创建非root用户提高安全性
RUN addgroup -S nodeapp && \
    adduser -S -G nodeapp nodeapp

COPY --from=development /usr/src/app/dist ./dist

# 切换到非root用户
USER nodeapp

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]
