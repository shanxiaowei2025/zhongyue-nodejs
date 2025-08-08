import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { Department } from '../../department/entities/department.entity';

@Injectable()
export class SalaryPermissionService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  /**
   * 检查用户是否是薪资管理员或超级管理员
   * @param userId 用户ID
   * @returns 是否有薪资管理权限
   */
  async isSalaryAdminOrSuperAdmin(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }

    // 检查是否包含 salary_admin 或 super_admin 角色
    return (
      user.roles.includes('salary_admin') || user.roles.includes('super_admin')
    );
  }

  /**
   * 检查薪资管理权限（除确认薪资外的所有操作）
   * @param userId 用户ID
   * @returns 是否有权限
   */
  async checkSalaryManagementPermission(userId: number): Promise<boolean> {
    const hasPermission = await this.isSalaryAdminOrSuperAdmin(userId);
    if (!hasPermission) {
      throw new ForbiddenException('只有薪资管理员和超级管理员可以执行此操作');
    }
    return true;
  }

  // 获取用户的所有权限名称
  async getUserPermissions(userId: number): Promise<string[]> {
    // 查询用户信息获取角色
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.roles || user.roles.length === 0) {
      return [];
    }

    // 查询用户角色名称
    const roles = await this.roleRepository.find({
      where: { code: In(user.roles) },
    });

    if (!roles || roles.length === 0) {
      return [];
    }

    // 获取角色对应的权限
    const roleNames = roles.map((role) => role.name);
    const permissions = await this.permissionRepository.find({
      where: {
        role_name: In(roleNames),
      },
    });

    // 只返回权限值为true的权限名称
    const enabledPermissions = permissions
      .filter((p) => p.permission_value === true)
      .map((p) => p.permission_name);

    return enabledPermissions;
  }

  // 检查用户是否有创建薪资记录的权限
  async hasSalaryCreatePermission(userId: number): Promise<boolean> {
    return await this.isSalaryAdminOrSuperAdmin(userId);
  }

  // 检查用户是否有编辑薪资记录的权限
  async hasSalaryEditPermission(userId: number): Promise<boolean> {
    return await this.isSalaryAdminOrSuperAdmin(userId);
  }

  // 检查用户是否有删除薪资记录的权限
  async hasSalaryDeletePermission(userId: number): Promise<boolean> {
    return await this.isSalaryAdminOrSuperAdmin(userId);
  }

  // 兼容旧的权限检查方法
  async checkPermission(req: any, salaryId?: number): Promise<boolean> {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }

    const userId = req.user.id;

    // 根据操作类型检查不同权限
    if (req.method === 'POST') {
      return this.hasSalaryCreatePermission(userId);
    } else if (req.method === 'PATCH' || req.method === 'PUT') {
      return this.hasSalaryEditPermission(userId);
    } else if (req.method === 'DELETE') {
      return this.hasSalaryDeletePermission(userId);
    } else {
      // 查询操作，检查是否是薪资管理员或超级管理员
      return await this.isSalaryAdminOrSuperAdmin(userId);
    }
  }

  // 根据用户权限构建薪资查询条件
  async buildSalaryQueryFilter(userId: number): Promise<any> {
    // 首先检查是否是薪资管理员或超级管理员
    const isSalaryAdmin = await this.isSalaryAdminOrSuperAdmin(userId);
    if (isSalaryAdmin) {
      // 薪资管理员和超级管理员可以查看所有记录
      return {};
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department'],
    });

    if (!user) {
      console.log('用户未找到:', userId);
      return { id: -1 }; // 确保不匹配任何记录
    }

    console.log('用户信息:', {
      username: user.username,
      roles: user.roles,
      department: user.department?.name,
    });

    const permissions = await this.getUserPermissions(userId);
    console.log('用户权限:', permissions);

    // 存储不同权限对应的查询条件
    const conditions: any[] = [];

    // 检查是否有任何薪资查看权限
    const hasViewPermission =
      permissions.includes('salary_date_view_all') ||
      permissions.includes('salary_date_view_by_location') ||
      permissions.includes('salary_date_view_own');

    // 如果没有任何查看权限，返回一个不可能满足的条件
    if (!hasViewPermission) {
      return { id: -1 }; // 确保不会匹配任何记录
    }

    // 处理查看所有权限
    if (permissions.includes('salary_date_view_all')) {
      conditions.push({}); // 空对象表示无限制条件
      return conditions; // 如果有查看所有权限，直接返回，不需要其他条件
    }

    // 处理按区域查看权限
    if (permissions.includes('salary_date_view_by_location')) {
      // 获取用户部门信息
      const department = await this.departmentRepository.findOne({
        where: { id: user.dept_id },
      });

      if (department) {
        const departmentName = department.name;

        // 检查部门名称是否以"分公司"结尾
        if (
          departmentName.length >= 3 &&
          departmentName.substring(departmentName.length - 3) === '分公司'
        ) {
          // 如果部门是分公司，则只能查看该分公司的记录
          conditions.push({
            department: departmentName,
          });
        } else {
          // 如果部门不是分公司，则可以查看所有非分公司的记录
          conditions.push({
            notDepartment: true, // 自定义标记，在服务中额外处理
          });
        }
      }
    }

    // 处理查看自己提交的权限
    if (permissions.includes('salary_date_view_own')) {
      conditions.push({
        name: user.username,
      });
    }

    // 如果没有任何权限条件，返回一个不可能满足的条件
    if (conditions.length === 0) {
      return { id: -1 }; // 确保不会匹配任何记录
    }

    console.log('查询条件:', conditions);

    // 如果只有一个条件，直接返回
    if (conditions.length === 1) {
      return conditions[0];
    }

    // 如果有多个条件，返回条件数组
    return conditions;
  }
}
