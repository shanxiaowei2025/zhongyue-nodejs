import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';
import { CreateDepartmentDto, UpdateDepartmentDto, DepartmentTreeNode, DepartmentQueryDto } from '../dto/department.dto';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private userRepository: Repository<User>, 
  ) {}

  /**
   * 创建部门
   */
  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentRepository.create({
      name: createDepartmentDto.name,
      sort: createDepartmentDto.sort,
      phone: createDepartmentDto.phone,
      principal: createDepartmentDto.principal,
      email: createDepartmentDto.email,
      status: createDepartmentDto.status,
      type: createDepartmentDto.type,
      remark: createDepartmentDto.remark,
    });

    // 处理父部门
    if (createDepartmentDto.parent_id) {
      const parent = await this.departmentRepository.findOneBy({ id: createDepartmentDto.parent_id });
      if (!parent) {
        throw new NotFoundException(`父部门ID为${createDepartmentDto.parent_id}的记录不存在`);
      }
      department.parent = parent;
    }

    return this.departmentRepository.save(department);
  }

  /**
   * 获取部门列表
   */
  async findAll(query?: DepartmentQueryDto): Promise<Department[] | DepartmentTreeNode[]> {
    const queryBuilder = this.departmentRepository.createQueryBuilder('department')
      .leftJoinAndSelect('department.parent', 'parent')
      .leftJoinAndSelect('department.children', 'children');
    
    // 添加过滤条件
    if (query?.status !== undefined) {
      queryBuilder.andWhere('department.status = :status', { status: query.status });
    }
    
    if (query?.type !== undefined) {
      queryBuilder.andWhere('department.type = :type', { type: query.type });
    }
    
    // 排序
    queryBuilder.orderBy('department.sort', 'ASC')
      .addOrderBy('department.id', 'ASC');
    
    const departments = await queryBuilder.getMany();
    
    // 如果需要树形结构
    if (query?.tree) {
      return this.buildDepartmentTree(departments);
    }
    
    return departments;
  }

  /**
   * 获取树形结构的部门数据
   */
  async getTreeList(): Promise<DepartmentTreeNode[]> {
    const allDepartments = await this.departmentRepository.find({
      relations: ['parent', 'children'],
      order: { sort: 'ASC', id: 'ASC' }
    });
    
    return this.buildDepartmentTree(allDepartments);
  }

  /**
   * 构建部门树结构
   */
  private buildDepartmentTree(departments: Department[]): DepartmentTreeNode[] {
    // 映射部门数据为树节点格式
    const departmentMap = new Map<number, DepartmentTreeNode>();
    
    departments.forEach(dept => {
      departmentMap.set(dept.id, {
        id: dept.id,
        name: dept.name,
        parent_id: dept.parent?.id,
        sort: dept.sort,
        phone: dept.phone,
        principal: dept.principal,
        email: dept.email,
        status: dept.status,
        type: dept.type,
        remark: dept.remark,
        create_time: dept.create_time,
        children: []
      });
    });
    
    // 构建树形结构
    const rootNodes: DepartmentTreeNode[] = [];
    
    departmentMap.forEach(node => {
      if (node.parent_id) {
        const parentNode = departmentMap.get(node.parent_id);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });
    
    return rootNodes;
  }

  /**
   * 获取指定部门
   */
  async findOne(id: number): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['parent', 'children']
    });

    if (!department) {
      throw new NotFoundException(`部门ID为${id}的记录不存在`);
    }

    return department;
  }

  /**
   * 更新部门
   */
  async update(id: number, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOne(id);
    
    // 更新基本信息
    if (updateDepartmentDto.name !== undefined) department.name = updateDepartmentDto.name;
    if (updateDepartmentDto.sort !== undefined) department.sort = updateDepartmentDto.sort;
    if (updateDepartmentDto.phone !== undefined) department.phone = updateDepartmentDto.phone;
    if (updateDepartmentDto.principal !== undefined) department.principal = updateDepartmentDto.principal;
    if (updateDepartmentDto.email !== undefined) department.email = updateDepartmentDto.email;
    if (updateDepartmentDto.status !== undefined) department.status = updateDepartmentDto.status;
    if (updateDepartmentDto.type !== undefined) department.type = updateDepartmentDto.type;
    if (updateDepartmentDto.remark !== undefined) department.remark = updateDepartmentDto.remark;
    
    // 处理父部门变更
    if (updateDepartmentDto.parent_id !== undefined) {
      if (updateDepartmentDto.parent_id === null) {
        department.parent = null;
      } else {
        // 不能将部门的父级设置为自己
        if (updateDepartmentDto.parent_id === id) {
          throw new BadRequestException('不能将部门的父级设置为自己');
        }
        
        const parent = await this.departmentRepository.findOneBy({ id: updateDepartmentDto.parent_id });
        if (!parent) {
          throw new NotFoundException(`父部门ID为${updateDepartmentDto.parent_id}的记录不存在`);
        }
        
        // 检查是否形成循环引用
        await this.checkCircularReference(id, updateDepartmentDto.parent_id);
        
        department.parent = parent;
      }
    }
    
    return this.departmentRepository.save(department);
  }

  /**
   * 检查是否形成循环引用（防止部门的父级设置为其子部门）
   */
  private async checkCircularReference(departmentId: number, parentId: number): Promise<void> {
    let currentParentId = parentId;
    
    while (currentParentId) {
      if (currentParentId === departmentId) {
        throw new BadRequestException('不能将部门的父级设置为其子部门，这将导致循环引用');
      }
      
      const parent = await this.departmentRepository.findOne({
        where: { id: currentParentId },
        relations: ['parent']
      });
      
      if (!parent || !parent.parent) {
        break;
      }
      
      currentParentId = parent.parent.id;
    }
  }

  /**
   * 删除部门
   */
  async remove(id: number): Promise<void> {
    const department = await this.findOne(id);
    
    // 检查是否有子部门
    if (department.children && department.children.length > 0) {
      throw new BadRequestException('该部门下有子部门，无法删除');
    }
    
    await this.departmentRepository.remove(department);
  }

  /**
   * 批量删除部门
   */
  async bulkRemove(ids: number[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const id of ids) {
      try {
        await this.remove(id);
        success++;
      } catch (error) {
        failed++;
      }
    }
    
    return { success, failed };
  }

  /**
   * 获取部门下的所有用户
   * 注意：需要结合用户服务来实现，这里只提供方法签名
   */
  async getDepartmentUsers(id: number): Promise<any[]> {
    // 验证部门是否存在
    await this.findOne(id);
    
    // 查询该部门下的所有用户
    const users = await this.userRepository.find({
      where: { dept_id: id },
      select: ['id', 'username', 'email', 'phone', 'isActive', 'roles', 'createdAt', 'updatedAt'] // 排除敏感信息
    });
    
    return users;
  }
}