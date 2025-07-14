import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionDto {
  @ApiProperty({ description: '页面名称', example: '合同管理' })
  @IsString()
  page_name: string;

  @ApiProperty({ description: '权限名称', example: 'contract_view' })
  @IsString()
  permission_name: string;

  @ApiProperty({ description: '权限值', example: true })
  @IsBoolean()
  permission_value: boolean;

  @ApiProperty({ description: '权限描述', example: '查看合同列表' })
  @IsString()
  description: string;
}

// 基础角色DTO
export class BaseRoleDto {
  @ApiPropertyOptional({ description: '状态', enum: [0, 1], default: 1 })
  @IsEnum([0, 1])
  @IsOptional()
  status?: number = 1;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;

//   @ApiPropertyOptional({ description: '权限列表' })
//   @IsArray()
//   @ValidateNested({ each: true }) 
//   @Type(() => PermissionDto)
//   @IsOptional()
//   permissions?: PermissionDto[];
}

export class CreateRoleDto extends BaseRoleDto {
  @ApiProperty({ description: '角色名称', example: '管理员' })
  @IsString()
  name: string;

  @ApiProperty({ description: '角色代码', example: 'admin' })
  @IsString()
  code: string;
}

export class UpdateRoleDto extends BaseRoleDto {
  @ApiPropertyOptional({ description: '角色名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '角色代码' })
  @IsString()
  @IsOptional()
  code?: string;
}

export class UpdateRolePermissionDto {
  @ApiProperty({ description: '权限列表' })
  @IsArray()
  @ValidateNested({ each: true }) 
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}