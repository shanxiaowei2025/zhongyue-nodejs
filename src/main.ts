import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // 使用枚举类型而非字符串
  const logLevels: LogLevel[] = ['error', 'warn', 'log', 'debug'];
  const app = await NestFactory.create(AppModule, {
    logger: process.env.LOG_LEVEL === 'debug' ? logLevels : 
            process.env.LOG_LEVEL === 'info' ? logLevels.slice(0, 3) as LogLevel[] :
            process.env.LOG_LEVEL === 'warn' ? logLevels.slice(0, 2) as LogLevel[] : 
            ['error'] as LogLevel[],
  });
  
  const logger = new Logger('Bootstrap');
  
  // 获取配置服务
  const configService = app.get(ConfigService);
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 启用CORS
  app.enableCors({
    origin: configService.get('app.cors.origin'),
    credentials: true,
  });
  
  // 只在非生产环境启用Swagger
  if (configService.get('app.env') !== 'production') {
    logger.log('启用Swagger API文档...');
    // 配置Swagger文档
    const config = new DocumentBuilder()
      .setTitle('中岳信息管理系统API')
      .setDescription('中岳信息管理系统后端API文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    
    // 关键修改：使用useGlobalPrefix: false选项禁用全局前缀
    SwaggerModule.setup('api/docs', app, document, {
      useGlobalPrefix: false
    });
  }
  
  // 获取配置端口和环境
  const port = configService.get('app.port');
  const env = configService.get('app.env');
  const logLevel = configService.get('app.logger.level');
  
  await app.listen(port);
  logger.log(`应用已启动 [${env}环境] [日志级别:${logLevel}]，访问: http://localhost:${port}/api`);
  
  // 只在非生产环境显示API文档地址
  if (configService.get('app.env') !== 'production') {
    logger.log(`API文档地址: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
