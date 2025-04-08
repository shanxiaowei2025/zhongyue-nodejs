import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from './common/swagger';

@ApiTags('系统')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '欢迎信息', description: '返回系统欢迎信息' })
  @ApiResponse({ status: 200, description: '成功返回欢迎信息' })
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('health')
  @ApiOperation({ summary: '健康检查', description: '检查系统是否正常运行' })
  @ApiResponse({ 
    status: 200, 
    description: '系统运行正常', 
    schema: {
      example: {
        status: 'ok',
        timestamp: '2023-04-07T10:00:00.000Z',
        version: '1.0.0'
      }
    }
  })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}