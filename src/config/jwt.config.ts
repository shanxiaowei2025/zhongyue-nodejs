import { registerAs } from '@nestjs/config';

// 导出一个名为 'jwt' 的配置对象
export default registerAs('jwt', () => ({
  // JWT密钥
  secret: process.env.JWT_SECRET || 'supersecret',
  // 含义：
  // 1. 读取 JWT 加密密钥
  // 2. 默认值 'supersecret'（生产环境必须修改）

  // Token过期时间
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // 含义：
  // 1. 设置token有效期
  // 2. 默认一天（'1d'）
}));