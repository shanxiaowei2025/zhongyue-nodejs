import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  env: process.env.APP_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  }
}));
