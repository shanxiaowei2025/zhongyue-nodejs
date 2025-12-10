import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAccountingFileCategoryDto {
  @ApiProperty({ description: '分类名称' })
  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @ApiPropertyOptional({ description: '父分类ID，不填则为顶级分类' })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}

export class UpdateAccountingFileCategoryDto {
  @ApiProperty({ description: '分类名称' })
  @IsString()
  @IsNotEmpty()
  categoryName: string;
}

export class AccountingFileCategoryResponseDto {
  @ApiProperty({ description: '分类ID' })
  id: number;

  @ApiProperty({ description: '分类名称' })
  categoryName: string;

  @ApiProperty({ description: '分类路径' })
  categoryPath: string;

  @ApiPropertyOptional({ description: '父分类ID' })
  parentId: number | null;

  @ApiProperty({ description: '子分类列表' })
  children: AccountingFileCategoryResponseDto[];
}

export class MoveFilesToCategoryDto {
  @ApiProperty({ description: '文件ID列表', type: [String] })
  @IsNotEmpty()
  fileIds: string[];

  @ApiProperty({ description: '目标分类ID' })
  @IsNumber()
  @IsNotEmpty()
  targetCategoryId: number;
}
