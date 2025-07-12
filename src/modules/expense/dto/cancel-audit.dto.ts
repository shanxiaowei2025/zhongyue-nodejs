import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelAuditDto {
  @ApiProperty({
    description: '取消审核原因',
    example: '信息录入有误，需要重新审核',
  })
  @IsString({ message: '取消原因必须是字符串' })
  @IsNotEmpty({ message: '取消原因不能为空' })
  cancelReason: string;
}
