/**
 * 环境感知的Swagger导入
 * 在开发环境使用真实的Swagger装饰器
 * 在生产环境使用空的装饰器实现
 */

// 根据环境决定使用哪个模块
const isProduction = process.env.NODE_ENV === 'production';
let providers: any;

if (isProduction) {
  providers = require('./providers/swagger.providers');
} else {
  providers = require('@nestjs/swagger');
}

// 导出所有需要的装饰器
export const {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
  SwaggerModule,
  DocumentBuilder
} = providers;