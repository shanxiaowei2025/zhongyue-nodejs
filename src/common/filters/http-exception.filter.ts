import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// 创建自定义的NaN错误类
export class NaNInQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NaNInQueryError';
  }
}

// 创建无效ID参数错误类
export class InvalidIdParameterError extends Error {
  constructor(id: any) {
    super(`无效的ID参数: ${id}`);
    this.name = 'InvalidIdParameterError';
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = '服务器内部错误';

    // 跳过健康检查端点的日志记录
    const isHealthCheck =
      request.url === '/api/health' || request.url === '/health';
    if (isHealthCheck && request.method === 'HEAD') {
      // 对于健康检查，只返回状态码，不记录日志
      response.status(HttpStatus.OK).end();
      return;
    }

    // 详细记录错误信息
    if (!isHealthCheck) {
      this.logger.error(`请求路径: ${request.url}`);
      this.logger.error(`请求方法: ${request.method}`);
      this.logger.error(`请求查询参数: ${JSON.stringify(request.query)}`);
      this.logger.error(`异常类型: ${exception.constructor.name}`);
    }

    // 针对不同类型的异常进行处理
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exceptionResponse;
      }

      if (!isHealthCheck) {
        this.logger.error(`HttpException: ${JSON.stringify(message)}`);
      }
    }
    // 处理TypeORM查询失败异常
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = (exception as QueryFailedError).message;

      if (!isHealthCheck) {
        this.logger.error(`QueryFailedError: ${message}`);
        this.logger.error(`SQL: ${(exception as any).query}`);
        this.logger.error(
          `参数: ${(exception as any).parameters ? JSON.stringify((exception as any).parameters) : 'none'}`,
        );
      }

      // 特殊处理NaN错误
      if (message.includes('NaN')) {
        message = '查询参数包含无效的数值，请检查请求参数';

        if (!isHealthCheck) {
          this.logger.error('检测到NaN错误，可能是日期参数或ID参数格式有误');

          // 尝试输出完整的请求参数，帮助调试
          try {
            this.logger.error(`完整请求体: ${JSON.stringify(request.body)}`);

            // 检查请求中的日期参数
            const queryParams = request.query;
            for (const key in queryParams) {
              const value = queryParams[key];

              // 检查可能的日期参数
              if (
                typeof value === 'string' &&
                value.match(/^\d{4}-\d{2}-\d{2}/)
              ) {
                this.logger.error(`可能的日期参数: ${key}=${value}`);
                const date = new Date(value);
                this.logger.error(
                  `转换后: ${date}, isNaN: ${isNaN(date.getTime())}`,
                );
              }

              // 检查可能的ID参数
              if (
                typeof value === 'string' &&
                key.toLowerCase().includes('id')
              ) {
                this.logger.error(`可能的ID参数: ${key}=${value}`);
                const numValue = Number(value);
                this.logger.error(
                  `转换后: ${numValue}, isNaN: ${isNaN(numValue)}`,
                );
              }
            }

            // 检查路径参数中的ID
            const pathParams = request.params;
            if (pathParams && pathParams.id) {
              this.logger.error(`路径ID参数: id=${pathParams.id}`);
              const numId = Number(pathParams.id);
              this.logger.error(`转换后: ${numId}, isNaN: ${isNaN(numId)}`);
            }
          } catch (error) {
            this.logger.error(`尝试解析请求参数出错: ${error.message}`);
          }
        }
      }
    }
    // 处理自定义NaN错误
    else if (exception instanceof NaNInQueryError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      if (!isHealthCheck) {
        this.logger.error(`NaNInQueryError: ${message}`);
      }
    }
    // 处理无效ID参数错误
    else if (exception instanceof InvalidIdParameterError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      if (!isHealthCheck) {
        this.logger.error(`InvalidIdParameterError: ${message}`);
      }
    }
    // 处理其他类型错误
    else {
      if (!isHealthCheck) {
        this.logger.error(`未知异常: ${exception}`);
        if (exception instanceof Error) {
          message = exception.message;
          this.logger.error(`错误堆栈: ${exception.stack}`);
        }
      }
    }

    response.status(status).json({
      code: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      data: null,
    });
  }
}
