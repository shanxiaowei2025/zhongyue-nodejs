import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { Role } from '../../roles/entities/role.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Expense } from '../../expense/entities/expense.entity';

@Injectable()
export class ReportsPermissionService {
  private readonly logger = new Logger(ReportsPermissionService.name);

  // 角色名称映射表：角色代码 -> 角色名称（与数据库roles表保持一致）
  private readonly roleMapping: Record<string, string> = {
    'super_admin': '超级管理员',
    'admin': '管理员', 
    'sales_specialist': '销售专员',
    'register_specialist': '注册专员',
    'admin_specialist': '行政专员',
    'consultantAccountant': '顾问会计', // 数据库中确实是这个代码
    'bookkeepingAccountant': '记账会计', // 数据库中确实是这个代码
    'invoiceOfficer': '开票员',
    'branch_manager': '分公司负责人',
    'expense_auditor': '费用审核员',
    'Archivist': '档案管理员',
    '14': '分公司档案管理员', // 对应数据库中的code为"14"
    'salary_admin': '薪资管理员'
  };

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * 检查用户是否有报表查看权限
   * 注意：已取消权限表限制，所有登录用户都可以查看报表
   */
  async checkReportPermission(
    userId: number,
    reportType: string
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['department']
      });

      if (!user) {
        this.logger.warn(`用户不存在: ${userId}`);
        return false;
      }

      // 已取消权限表限制，所有有效用户都可以查看报表
      this.logger.log(`用户 ${userId} 访问报表 ${reportType}，权限检查通过（已取消权限表限制）`);
      return true;

      // 以下代码已被注释掉 - 原权限检查逻辑
      /*
      // 超级管理员和管理员拥有所有权限
      if (user.roles?.includes('super_admin') || user.roles?.includes('admin')) {
        return true;
      }

      // 检查具体的报表权限
      const permissionName = `reports_${reportType}`;
      
            // 检查用户角色是否有对应权限
      if (user.roles && user.roles.length > 0) {
        for (const role of user.roles) {
          // 将英文角色名映射为中文角色名
          const chineseRoleName = this.roleMapping[role] || role;
          
          const permission = await this.permissionRepository.findOne({
            where: {
              role_name: chineseRoleName,
              permission_name: permissionName
            }
          });

          if (permission?.permission_value) {
            return true;
          }
        }
      }

      // 如果没有找到特定权限，检查是否有通用报表查看权限
      if (user.roles && user.roles.length > 0) {
        for (const role of user.roles) {
          // 将英文角色名映射为中文角色名
          const chineseRoleName = this.roleMapping[role] || role;
          
          const generalPermission = await this.permissionRepository.findOne({
            where: {
              role_name: chineseRoleName,
              permission_name: 'reports_view'
            }
          });

           if (generalPermission?.permission_value) {
             return true;
           }
        }
      }

      return false;
      */
    } catch (error) {
      this.logger.error(`检查报表权限失败: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 获取用户可查看的客户数据过滤条件
   */
  async getCustomerDataFilter(userId: number): Promise<(qb: SelectQueryBuilder<Customer>) => void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['department']
      });

      if (!user) {
        // 用户不存在，返回无数据过滤器
        return (qb: SelectQueryBuilder<Customer>) => {
          qb.andWhere('1 = 0'); // 永远为false的条件
        };
      }

      // 管理员可查看所有数据
      if (user.roles?.includes('super_admin') || user.roles?.includes('admin')) {
        return (qb: SelectQueryBuilder<Customer>) => {
          // 无过滤条件，可查看所有数据
        };
      }

      // 获取用户权限
      const permissions = await this.getUserPermissions(userId);
      this.logger.warn(`[DEBUG] 用户 ${userId} 的客户权限: ${permissions.join(', ')}`);

      // 检查是否有查看所有客户数据的权限
      if (permissions.includes('customer_data_view_all')) {
        this.logger.warn(`[DEBUG] 用户 ${userId} 拥有 customer_data_view_all 权限，可查看所有客户数据`);
        return (qb: SelectQueryBuilder<Customer>) => {
          // 无过滤条件，可查看所有数据
        };
      }

      // 构建权限过滤条件
      return (qb: SelectQueryBuilder<Customer>) => {
        const conditions: string[] = [];
        const parameters: any = {};

        // 检查按区域查看权限
        if (permissions.includes('customer_data_view_by_location') && user.department) {
          conditions.push('customer.location = :userLocation');
          parameters.userLocation = user.department.name;
          this.logger.warn(`[DEBUG] 用户 ${userId} 拥有按区域查看客户权限，区域: ${user.department.name}`);
        }

        // 检查查看自己负责客户的权限
        if (permissions.includes('customer_data_view_own')) {
          conditions.push('(customer.consultantAccountant = :username OR customer.bookkeepingAccountant = :username OR customer.invoiceOfficer = :username)');
          parameters.username = user.username;
          this.logger.warn(`[DEBUG] 用户 ${userId} 拥有查看自己负责客户的权限，用户名: ${user.username}`);
        }

        // 如果没有任何权限条件，拒绝访问
        if (conditions.length === 0) {
          this.logger.warn(`用户 ${userId} 没有任何客户数据查看权限`);
          qb.andWhere('1 = 0');
        } else {
          // 使用 OR 连接多个权限条件
          qb.andWhere(`(${conditions.join(' OR ')})`, parameters);
          this.logger.warn(`[DEBUG] 用户 ${userId} 应用客户过滤条件: ${conditions.join(' OR ')}, 参数: ${JSON.stringify(parameters)}`);
        }
      };
    } catch (error) {
      this.logger.error(`获取客户数据过滤条件失败: ${error.message}`, error.stack);
      // 出错时返回限制性过滤器
      return (qb: SelectQueryBuilder<Customer>) => {
        qb.andWhere('1 = 0');
      };
    }
  }

  /**
   * 获取用户可查看的费用数据过滤条件
   * 基于 expense_data_view_all、expense_data_view_by_location、expense_data_view_own 权限
   */
  async getExpenseDataFilter(userId: number): Promise<(qb: SelectQueryBuilder<Expense>) => void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['department']
      });

      if (!user) {
        return (qb: SelectQueryBuilder<Expense>) => {
          qb.andWhere('1 = 0');
        };
      }

      // 获取用户的所有权限
      const permissions = await this.getUserPermissions(userId);
      this.logger.log(`用户 ${userId} (${user.username}) 的费用权限: ${permissions.join(', ')}, 部门: ${user.department?.name || '无'}`);

      // 检查是否有查看所有费用数据的权限
      if (permissions.includes('expense_data_view_all')) {
        this.logger.log(`用户 ${userId} 拥有 expense_data_view_all 权限，可查看所有费用数据`);
        return (qb: SelectQueryBuilder<Expense>) => {
          // 无过滤条件，可查看所有数据
        };
      }

      // 构建权限过滤条件
      return (qb: SelectQueryBuilder<Expense>) => {
        const conditions: string[] = [];
        const parameters: any = {};

        // 检查按区域查看权限
        if (permissions.includes('expense_data_view_by_location') && user.department) {
          conditions.push('expense.companyLocation = :userLocation');
          parameters.userLocation = user.department.name;
          this.logger.log(`用户 ${userId} 拥有按区域查看权限，区域: ${user.department.name}`);
        }

        // 检查查看自己数据的权限
        if (permissions.includes('expense_data_view_own')) {
          conditions.push('expense.salesperson = :username');
          parameters.username = user.username;
          this.logger.log(`用户 ${userId} 拥有查看自己数据的权限，用户名: ${user.username}`);
        }

        // 如果没有任何权限条件，拒绝访问
        if (conditions.length === 0) {
          this.logger.warn(`用户 ${userId} 没有任何费用数据查看权限`);
          qb.andWhere('1 = 0');
        } else {
          // 使用 OR 连接多个权限条件
          qb.andWhere(`(${conditions.join(' OR ')})`, parameters);
        }
      };
    } catch (error) {
      this.logger.error(`获取费用数据过滤条件失败: ${error.message}`, error.stack);
      return (qb: SelectQueryBuilder<Expense>) => {
        qb.andWhere('1 = 0');
      };
    }
  }

  /**
   * 获取用户的所有权限名称
   * 与费用模块保持一致的权限获取逻辑
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || !user.roles || user.roles.length === 0) {
        return [];
      }

      const roles = await this.roleRepository.find({
        where: { code: In(user.roles) },
      });
      if (!roles || roles.length === 0) {
        return [];
      }

      const roleNames = roles.map((role) => role.name);
      const permissions = await this.permissionRepository.find({
        where: {
          role_name: In(roleNames),
        },
      });

      const enabledPermissions = permissions
        .filter((p) => p.permission_value === true)
        .map((p) => p.permission_name);

      return enabledPermissions;
    } catch (error) {
      this.logger.error(`获取用户权限失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 检查用户是否有特定权限
   */
  private hasPermission(user: User, permissionName: string): boolean {
    // 这里可以实现更复杂的权限检查逻辑
    // 目前简化为检查角色
    return user.roles?.some(role => 
      ['super_admin', 'admin'].includes(role)
    ) || false;
  }

  /**
   * 检查用户是否有导出权限
   */
  async checkExportPermission(userId: number): Promise<boolean> {
    return this.checkReportPermission(userId, 'export');
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: number): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { id: userId },
        relations: ['department']
      });
    } catch (error) {
      this.logger.error(`获取用户信息失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 检查用户是否为管理员
   */
  async isAdmin(userId: number): Promise<boolean> {
    const user = await this.getUserInfo(userId);
    return user?.roles?.includes('super_admin') || 
           user?.roles?.includes('admin') || 
           false;
  }
} 