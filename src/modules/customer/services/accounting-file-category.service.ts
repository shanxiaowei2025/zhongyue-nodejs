import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AccountingFileCategory } from '../entities/accounting-file-category.entity';
import {
  CreateAccountingFileCategoryDto,
  UpdateAccountingFileCategoryDto,
} from '../dto/accounting-file-category.dto';

@Injectable()
export class AccountingFileCategoryService {
  private readonly logger = new Logger(AccountingFileCategoryService.name);

  constructor(
    @InjectRepository(AccountingFileCategory)
    private readonly categoryRepository: Repository<AccountingFileCategory>,
  ) {}

  /**
   * 创建分类
   */
  async createCategory(
    customerId: number,
    createDto: CreateAccountingFileCategoryDto,
  ): Promise<AccountingFileCategory> {
    const { categoryName, parentId } = createDto;

    // 如果指定了父分类，验证父分类是否存在
    if (parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: parentId, customerId },
      });
      if (!parent) {
        throw new BadRequestException('父分类不存在');
      }
    }

    // 生成分类路径
    let categoryPath = categoryName;
    if (parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: parentId },
      });
      if (parent) {
        categoryPath = `${parent.categoryPath}/${categoryName}`;
      }
    }

    const category = this.categoryRepository.create({
      customerId,
      categoryName,
      categoryPath,
      parentId: parentId || null,
    });

    return await this.categoryRepository.save(category);
  }

  /**
   * 更新分类
   */
  async updateCategory(
    categoryId: number,
    updateDto: UpdateAccountingFileCategoryDto,
  ): Promise<AccountingFileCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    const { categoryName } = updateDto;

    // 更新分类名称和路径
    let newCategoryPath = categoryName;
    if (category.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: category.parentId },
      });
      if (parent) {
        newCategoryPath = `${parent.categoryPath}/${categoryName}`;
      }
    }

    category.categoryName = categoryName;
    category.categoryPath = newCategoryPath;

    // 更新所有子分类的路径
    await this.updateChildrenPaths(categoryId, newCategoryPath);

    return await this.categoryRepository.save(category);
  }

  /**
   * 递归更新子分类的路径
   */
  private async updateChildrenPaths(
    parentId: number,
    parentPath: string,
  ): Promise<void> {
    const children = await this.categoryRepository.find({
      where: { parentId },
    });

    for (const child of children) {
      child.categoryPath = `${parentPath}/${child.categoryName}`;
      await this.categoryRepository.save(child);
      await this.updateChildrenPaths(child.id, child.categoryPath);
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(categoryId: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 级联删除所有子分类
    await this.deleteCategoryRecursive(categoryId);
  }

  /**
   * 递归删除分类及其子分类
   */
  private async deleteCategoryRecursive(categoryId: number): Promise<void> {
    const children = await this.categoryRepository.find({
      where: { parentId: categoryId },
    });

    for (const child of children) {
      await this.deleteCategoryRecursive(child.id);
    }

    await this.categoryRepository.delete(categoryId);
  }

  /**
   * 获取分类树（包含子分类）
   */
  async getCategoryTree(customerId: number): Promise<any[]> {
    // 获取所有顶级分类（parentId 为 null）
    const topLevelCategories = await this.categoryRepository.find({
      where: { customerId, parentId: IsNull() },
      order: { createdAt: 'ASC' },
    });

    this.logger.log(
      `客户 ${customerId} 的顶级分类数: ${topLevelCategories.length}`,
    );
    this.logger.log(
      `顶级分类详情: ${JSON.stringify(topLevelCategories.map((c) => ({ id: c.id, name: c.categoryName, parentId: c.parentId })))}`,
    );

    // 为每个顶级分类构建树结构
    const tree = await Promise.all(
      topLevelCategories.map((category) => this.buildCategoryTree(category)),
    );

    this.logger.log(`构建完成的分类树数量: ${tree.length}`);
    this.logger.log(
      `返回的树结构: ${JSON.stringify(tree.map((c) => ({ id: c.id, name: c.categoryName, parentId: c.parentId, childrenCount: c.children ? c.children.length : 0 })))}`,
    );

    return tree;
  }

  /**
   * 构建单个分类的树结构
   */
  private async buildCategoryTree(
    category: AccountingFileCategory,
  ): Promise<any> {
    const children = await this.categoryRepository.find({
      where: { parentId: category.id },
      order: { createdAt: 'ASC' },
    });

    // 构建包含children的对象
    const categoryWithChildren = {
      ...category,
      children: await Promise.all(
        children.map((child) => this.buildCategoryTree(child)),
      ),
    };

    return categoryWithChildren;
  }

  /**
   * 获取单个分类
   */
  async getCategory(categoryId: number): Promise<AccountingFileCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  /**
   * 获取分类下的所有文件ID
   */
  async getCategoryFileIds(): Promise<string[]> {
    // 这个方法需要在Customer Service中实现，因为文件存储在customer表的accountingRequiredFiles字段中
    // 这里只是定义接口
    return [];
  }

  /**
   * 检查分类是否属于指定客户
   */
  async belongsToCustomer(
    categoryId: number,
    customerId: number,
  ): Promise<boolean> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, customerId },
    });

    return !!category;
  }
}
