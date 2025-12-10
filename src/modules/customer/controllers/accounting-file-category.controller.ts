import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AccountingFileCategoryService } from '../services/accounting-file-category.service';
import {
  CreateAccountingFileCategoryDto,
  UpdateAccountingFileCategoryDto,
  AccountingFileCategoryResponseDto,
} from '../dto/accounting-file-category.dto';

@ApiTags('做账所需资料分类管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer/:customerId/accounting-categories')
export class AccountingFileCategoryController {
  private readonly logger = new Logger(AccountingFileCategoryController.name);

  constructor(
    private readonly categoryService: AccountingFileCategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建分类' })
  @ApiResponse({
    status: 201,
    description: '分类创建成功',
    type: AccountingFileCategoryResponseDto,
  })
  async createCategory(
    @Param('customerId') customerId: number,
    @Body() createDto: CreateAccountingFileCategoryDto,
    @Request() req,
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }

    this.logger.log(
      `用户 ${req.user.id} 为客户 ${customerId} 创建分类: ${createDto.categoryName}`,
    );

    return await this.categoryService.createCategory(customerId, createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取分类树' })
  @ApiResponse({
    status: 200,
    description: '获取分类树成功',
    type: [AccountingFileCategoryResponseDto],
  })
  async getCategoryTree(
    @Param('customerId') customerId: number,
    @Request() req,
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }

    this.logger.log(`用户 ${req.user.id} 获取客户 ${customerId} 的分类树`);

    const result = await this.categoryService.getCategoryTree(customerId);
    this.logger.log(`控制器返回的分类树数量: ${result.length}`);
    this.logger.log(
      `控制器返回的分类树: ${JSON.stringify(result.map((c) => ({ id: c.id, name: c.categoryName, parentId: c.parentId, childrenCount: c.children ? c.children.length : 0 })))}`,
    );

    return result;
  }

  @Patch(':categoryId')
  @ApiOperation({ summary: '更新分类' })
  @ApiResponse({
    status: 200,
    description: '分类更新成功',
    type: AccountingFileCategoryResponseDto,
  })
  async updateCategory(
    @Param('customerId') customerId: number,
    @Param('categoryId') categoryId: number,
    @Body() updateDto: UpdateAccountingFileCategoryDto,
    @Request() req,
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }

    // 验证分类是否属于该客户
    const belongsToCustomer = await this.categoryService.belongsToCustomer(
      categoryId,
      customerId,
    );
    if (!belongsToCustomer) {
      throw new ForbiddenException('无权修改此分类');
    }

    this.logger.log(
      `用户 ${req.user.id} 更新客户 ${customerId} 的分类 ${categoryId}`,
    );

    return await this.categoryService.updateCategory(categoryId, updateDto);
  }

  @Delete(':categoryId')
  @ApiOperation({ summary: '删除分类' })
  @ApiResponse({
    status: 200,
    description: '分类删除成功',
  })
  async deleteCategory(
    @Param('customerId') customerId: number,
    @Param('categoryId') categoryId: number,
    @Request() req,
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }

    // 验证分类是否属于该客户
    const belongsToCustomer = await this.categoryService.belongsToCustomer(
      categoryId,
      customerId,
    );
    if (!belongsToCustomer) {
      throw new ForbiddenException('无权删除此分类');
    }

    this.logger.log(
      `用户 ${req.user.id} 删除客户 ${customerId} 的分类 ${categoryId}`,
    );

    await this.categoryService.deleteCategory(categoryId);

    return { message: '分类删除成功' };
  }
}
