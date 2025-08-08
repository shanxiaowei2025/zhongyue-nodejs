import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsEmail,
  IsArray,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: '部门名称', example: '技术部' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '父部门ID' })
  @IsNumber()
  @IsOptional()
  parent_id?: number;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsNumber()
  @IsOptional()
  sort?: number = 0;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: '负责人' })
  @IsString()
  @IsOptional()
  principal?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '状态', enum: [0, 1], default: 1 })
  @IsEnum([0, 1])
  @IsOptional()
  status?: number = 1;

  @ApiPropertyOptional({ description: '类型', enum: [1, 2, 3], default: 3 })
  @IsEnum([1, 2, 3])
  @IsOptional()
  type?: number = 3;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateDepartmentDto extends CreateDepartmentDto {
  @ApiPropertyOptional({ description: '部门名称' })
  @IsString()
  @IsOptional()
  name: string;
}

export class DepartmentTreeNode {
  id: number;
  name: string;
  parent_id?: number;
  sort: number;
  phone: string;
  principal: string;
  email: string;
  status: number;
  type: number;
  remark: string;
  create_time: Date;
  children?: DepartmentTreeNode[];
}

export class DepartmentQueryDto {
  @ApiPropertyOptional({ description: '是否返回树形结构', default: false })
  @IsOptional()
  tree?: boolean;

  @ApiPropertyOptional({ description: '状态过滤', enum: [0, 1] })
  @IsEnum([0, 1])
  @IsOptional()
  status?: number;

  @ApiPropertyOptional({ description: '类型过滤', enum: [1, 2, 3] })
  @IsEnum([1, 2, 3])
  @IsOptional()
  type?: number;
}
export class BulkDeleteDto {
  @ApiProperty({
    description: '要删除的部门ID数组',
    example: [5, 6, 7],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
