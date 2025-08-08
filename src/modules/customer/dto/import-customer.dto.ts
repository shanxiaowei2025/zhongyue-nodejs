import { ApiProperty } from '@nestjs/swagger';

export class ImportCustomerDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '客户数据Excel文件',
  })
  file: Express.Multer.File;
}
