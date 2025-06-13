// 主文件，就像工厂的入口
// 这些是我们需要用到的工具，就像在工具箱里拿工具一样
import { NestFactory } from '@nestjs/core'; // 这是创建应用的工厂，就像开厂需要的机器
import { AppModule } from './app.module'; // 这是我们的主模块，像是产品的设计图
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common'; // 这些是验证和日志工具
import { ConfigService } from '@nestjs/config'; // 这是读取配置的工具
import { TransformInterceptor } from './common/interceptors/transform.interceptor'; // 这是处理返回数据的工具
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; // 这是处理错误的工具
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // 这是生成API文档的工具
import { BulkDeleteDto } from './modules/department/dto/department.dto';
import { SaveSignatureDto } from './modules/contract/dto/save-signature.dto';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import * as express from 'express';

// 启动应用
async function bootstrap() {
  // 设置日志级别，就像设置警报等级
  const logLevels: LogLevel[] = ['error', 'warn', 'log', 'debug'];

  // 创建应用，就像开启一个工厂
  const app = await NestFactory.create(AppModule, {
    // 根据环境设置不同的日志级别
    logger:
      process.env.LOG_LEVEL === 'debug'
        ? logLevels // 调试模式：显示所有日志
        : process.env.LOG_LEVEL === 'info'
          ? logLevels.slice(0, 3) // 信息模式：显示错误、警告、普通日志
          : process.env.LOG_LEVEL === 'warn'
            ? logLevels.slice(0, 2) // 警告模式：只显示错误和警告
            : ['error'], // 默认模式：只显示错误
  });

  // 创建日志记录器，就像设置一个记录本
  const logger = new Logger('Bootstrap');

  // 获取配置服务，用来读取配置文件
  const configService = app.get(ConfigService);

  // 设置API前缀，所有接口都会加上 '/api'
  // 比如 /users 变成 /api/users
  app.setGlobalPrefix('api');

  // 设置全局验证，就像在工厂入口设置安检
  // 添加验证管道防止非法数据
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 只允许定义过的数据通过
      transform: true, // 自动转换数据类型
      forbidNonWhitelisted: false, // 更改为false，允许未定义的数据通过但会被过滤
      transformOptions: {
        enableImplicitConversion: true, // 允许自动类型转换
      },
      skipMissingProperties: true, // 跳过缺失的属性
      disableErrorMessages: false, // 允许错误消息
      validationError: { 
        target: false, // 不返回目标对象
        value: false   // 不返回值
      },
    }),
  );

  // 设置响应拦截器，统一处理返回的数据格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 设置错误处理，统一处理所有错误
  app.useGlobalFilters(new HttpExceptionFilter());

  // 设置文件上传限制
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // 允许其他网站访问我们的API
  app.enableCors({
    origin: configService.get('app.cors.origin'), // 允许访问的网站
    credentials: true, // 允许携带认证信息
  });

  // 使用cookie解析
  app.use(cookieParser());

  // 配置静态文件服务
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // 配置文件上传大小限制
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 只在开发环境下显示API文档
  if (configService.get('app.env') !== 'production') {
    logger.log('启用Swagger API文档...');
    // 设置API文档的基本信息
    const config = new DocumentBuilder()
      .setTitle('中岳信息管理系统API文档')
      .setDescription('中岳信息管理系统后端API接口文档')
      .setVersion('1.0')
      .addBearerAuth() // 添加token认证
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true, // 确保深度扫描所有路由
      extraModels: [BulkDeleteDto, SaveSignatureDto] // 确保包含额外模型
    });

    // 设置文档访问路径为 /api/docs
    SwaggerModule.setup('api/docs', app, document, {
      useGlobalPrefix: false,
    });
  }

  // 配置文件上传大小限制
  app.use('/api/storage/upload', (req, res, next) => {
    logger.log('文件上传请求拦截');
    
    // 检查query参数中是否有token，如果有就添加到headers中方便守卫获取
    if (req.query && req.query.token) {
      logger.debug(`在请求query中找到token: ${req.query.token}, 将其添加到headers中`);
      req.headers['contract-token'] = req.query.token as string;
    }
    
    next();
  });

  // 获取配置信息
  const port = configService.get('app.port'); // 获取端口号
  const env = configService.get('app.env'); // 获取环境
  const logLevel = configService.get('app.logger.level'); // 获取日志级别

  // 启动应用
  await app.listen(port);
  // 打印启动信息
  logger.log(
    `应用已启动 [${env}环境] [日志级别:${logLevel}]，访问: http://localhost:${port}/api`,
  );

  // 在开发环境显示文档地址
  if (configService.get('app.env') !== 'production') {
    logger.log(`API文档地址: http://localhost:${port}/api/docs`);
  }
}

// 运行启动函数
bootstrap();
