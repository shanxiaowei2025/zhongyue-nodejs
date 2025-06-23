import { IsString, IsOptional, IsNumber, IsDate, IsObject, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  /**
   * 员工姓名
   * @example '张三'
   */
  @ApiProperty({ description: '员工姓名', example: '张三' })
  @IsString()
  name: string;

  /**
   * 部门
   * @example 1
   */
  @ApiProperty({ description: '部门ID', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  departmentId?: number;

  /**
   * 角色
   * @example ['销售专员', '顾问会计']
   */
  @ApiProperty({ description: '角色', example: ['销售专员', '顾问会计'], required: false, type: [String] })
  @IsArray()
  @IsOptional()
  roles?: string[];

  /**
   * 员工类型
   * @example '正式'
   */
  @ApiProperty({ description: '员工类型', example: '正式', required: false })
  @IsString()
  @IsOptional()
  employeeType?: string;

  /**
   * 提成比率职位
   * @example '高级顾问'
   */
  @ApiProperty({ description: '提成比率职位', example: '高级顾问', required: false })
  @IsString()
  @IsOptional()
  commissionRatePosition?: string;

  /**
   * 是否离职
   * @example false
   */
  @ApiProperty({ description: '是否离职', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isResigned?: boolean;

  /**
   * 工资基数
   * @example 5000
   */
  @ApiProperty({ description: '工资基数', example: 5000, required: false })
  @IsNumber()
  @IsOptional()
  baseSalary?: number;

  /**
   * 简历内容
   * @example [{"fileName": "简历.pdf", "fileUrl": "https://example.com/resume.pdf"}]
   */
  @ApiProperty({ 
    description: '简历信息', 
    example: [{"fileName": "简历.pdf", "fileUrl": "https://example.com/resume.pdf", "fileSize": 1024, "fileType": "application/pdf", "uploadTime": "2023-01-01T00:00:00Z"}],
    required: false,
    isArray: true
  })
  @IsOptional()
  resume?: any;

  /**
   * 生日
   * @example '1990-01-01'
   */
  @ApiProperty({ description: '生日', example: '1990-01-01', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthday?: Date;

  /**
   * 身份证号
   * @example '110101199001011234'
   */
  @ApiProperty({ description: '身份证号', example: '110101199001011234', required: false })
  @IsString()
  @IsOptional()
  idCardNumber?: string;

  /**
   * 银行卡号
   * @example '6225888888888888'
   */
  @ApiProperty({ description: '银行卡号', example: '6225888888888888', required: false })
  @IsString()
  @IsOptional()
  bankCardNumber?: string;

  /**
   * 入职时间
   * @example '2023-01-01'
   */
  @ApiProperty({ description: '入职时间', example: '2023-01-01', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  hireDate?: Date;

  /**
   * 工龄
   * @example 3
   */
  @ApiProperty({ description: '公司工龄', example: 3, required: false })
  @IsNumber()
  @IsOptional()
  workYears?: number;
} 