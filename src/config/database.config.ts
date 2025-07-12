import { registerAs } from '@nestjs/config';

// 导出一个名为 'database' 的配置对象
export default registerAs('database', () => ({
  // 数据库主机地址
  host: process.env.DB_HOST || 'localhost',
  // 含义：
  // 1. 读取 DB_HOST 环境变量
  // 2. 默认使用 'localhost'（本地主机）

  // 数据库端口
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  // 含义：
  // 1. 读取 DB_PORT 环境变量并转换为数字
  // 2. 默认使用 3306（MySQL默认端口）

  // 数据库用户名
  username: process.env.DB_USERNAME || 'root',
  // 含义：
  // 1. 读取数据库用户名
  // 2. 默认使用 'root'（不推荐在生产环境使用）

  // 数据库密码
  password: process.env.DB_PASSWORD || 'root',
  // 含义：
  // 1. 读取数据库密码
  // 2. 默认使用 'root'（请在生产环境修改）

  // 数据库名称
  database: process.env.DB_DATABASE || 'zhongyue',
  // 含义：
  // 1. 读取数据库名称
  // 2. 默认使用 'zhongyue'
}));
