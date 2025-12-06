// 导入 registerAs 函数，用于注册配置模块
import { registerAs } from '@nestjs/config';

// 导出一个名为 'app' 的配置对象
export default registerAs('app', () => ({
  // 设置应用端口
  port: parseInt(process.env.APP_PORT, 10) || 3001,
  // 含义：
  // 1. 尝试读取环境变量 APP_PORT
  // 2. parseInt 将字符串转为数字，10表示十进制
  // 3. || 3001 表示如果没有设置，就使用默认值3001

  // 设置运行环境
  env: process.env.APP_ENV || 'development',
  // 含义：
  // 1. 读取 APP_ENV 环境变量
  // 2. 如果没有设置，默认使用 'development'（开发环境）

  // 设置CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  // 含义：
  // 1. 读取 CORS_ORIGIN 环境变量
  // 2. 如果没有设置，默认使用 '*'（允许所有来源）

  // 设置日志级别
  logger: {
    level: process.env.LOG_LEVEL || 'warn',
  },
  // 含义：
  // 1. 读取 LOG_LEVEL 环境变量
  // 2. 如果没有设置，默认使用 'warn'（警告级别）
}));
