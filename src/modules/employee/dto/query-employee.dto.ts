import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 查询员工DTO
 */
export class QueryEmployeeDto extends PaginationDto {
  /**
   * 员工姓名
   * @example '张三'
   */
  @ApiPropertyOptional({ description: '姓名', example: '张三' })
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * 部门ID
   * @example 1
   */
  @ApiPropertyOptional({ description: '部门', example: 1 })
  @IsNumber()
  @IsOptional()
  departmentId?: number;

  /**
   * 员工类型
   * @example '全职'
   */
  @ApiPropertyOptional({ description: '员工类型', example: '全职' })
  @IsString()
  @IsOptional()
  employeeType?: string;

  /**
   * 提成比率职位
   * @example '高级顾问'
   */
  @ApiPropertyOptional({ description: '提成比率职位', example: '高级顾问' })
  @IsString()
  @IsOptional()
  commissionRatePosition?: string;

  /**
   * 职位
   * @example '项目经理'
   */
  @ApiPropertyOptional({ description: '职位', example: '项目经理' })
  @IsString()
  @IsOptional()
  position?: string;

  /**
   * 职级
   * @example 'P5'
   */
  @ApiPropertyOptional({ description: '职级', example: 'P5' })
  @IsString()
  @IsOptional()
  rank?: string;

  /**
   * 是否离职
   * @example false
   */
  @ApiPropertyOptional({ description: '是否离职', example: false })
  @IsBoolean()
  @IsOptional()
  isResigned?: boolean;

  /**
   * 实际生日
   * @example '农历1990年正月初一'
   */
  @ApiPropertyOptional({ description: '实际生日', example: '农历1990年正月初一' })
  @IsString()
  @IsOptional()
  actualBirthday?: string;

  /**
   * 身份证号
   * @example '110101199001011234'
   */
  @ApiPropertyOptional({ description: '身份证号', example: '110101199001011234' })
  @IsString()
  @IsOptional()
  idCardNumber?: string;
  
  /**
   * 开户银行
   * @example '中国工商银行'
   */
  @ApiPropertyOptional({ description: '开户银行', example: '中国工商银行' })
  @IsString()
  @IsOptional()
  bankName?: string;
} 