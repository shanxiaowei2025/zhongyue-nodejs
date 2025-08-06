import { ApiProperty } from '@nestjs/swagger';

export class SalaryVerifyResponseDto {
  @ApiProperty({ 
    description: '薪资访问令牌', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdCIsInRva2VuVHlwZSI6InNhbGFyeSIsImlhdCI6MTY5ODc0NDAwMCwiZXhwIjoxNjk4NzQ1ODAwfQ.example_signature'
  })
  salaryAccessToken: string;

  @ApiProperty({ 
    description: '令牌有效期（秒）', 
    example: 1800 
  })
  expiresIn: number;

  @ApiProperty({ 
    description: '响应消息', 
    example: '薪资访问权限验证成功' 
  })
  message: string;
}

export class SalaryPasswordStatusDto {
  @ApiProperty({ 
    description: '是否已设置薪资密码', 
    example: true 
  })
  hasPassword: boolean;

  @ApiProperty({ 
    description: '薪资密码最后更新时间', 
    example: '2023-12-01T10:00:00.000Z',
    nullable: true 
  })
  lastUpdated: string | null;
}

export class SalaryPasswordOperationResponseDto {
  @ApiProperty({ 
    description: '操作结果消息', 
    example: '薪资密码设置成功' 
  })
  message: string;

  @ApiProperty({ 
    description: '操作时间戳', 
    example: '2023-12-01T10:00:00.000Z' 
  })
  timestamp: string;
} 