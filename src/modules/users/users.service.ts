import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { RoleService } from '../roles/services/role.service';
import { PermissionService } from '../permissions/services/permission.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>, // 注入用户数据库操作工具
    private roleService: RoleService,
    private permissionService: PermissionService,
  ) {}

  // 根据用户名查找用户
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['department'],
    });
  }

  // 根据身份证号查找用户
  async findByIdCardNumber(idCardNumber: string): Promise<User | null> {
    if (!idCardNumber) {
      return null;
    }
    return this.userRepository.findOne({ where: { idCardNumber } });
  }

  // 根据用户ID查找用户
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['department'],
    });
  }

  // 创建新用户，添加当前用户参数
  async create(
    createUserDto: CreateUserDto,
    currentUser?: User,
  ): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    // 检查身份证号是否已存在（如果提供了身份证号）
    if (createUserDto.idCardNumber) {
      const existingUserWithIdCard = await this.userRepository.findOne({
        where: { idCardNumber: createUserDto.idCardNumber },
      });
      if (existingUserWithIdCard) {
        throw new BadRequestException('身份证号已存在');
      }
    }

    // 获取要创建的用户角色，如果没有设置，默认为['user']
    const userRoles = createUserDto.roles || ['user'];

    // 如果有当前用户，检查权限
    if (currentUser) {
      this.checkUserRolePermission(
        currentUser.roles,
        userRoles,
        currentUser.id,
      );
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  // 通用权限检查方法
  private checkUserRolePermission(
    currentUserRoles: string[],
    targetUserRoles: string[],
    currentUserId?: number,
    targetUserId?: number,
  ): void {
    // 允许用户修改自己的信息
    if (currentUserId && targetUserId && currentUserId === targetUserId) {
      return; // 允许用户修改自己的信息
    }

    // 如果当前用户是超级管理员
    if (currentUserRoles.includes('super_admin')) {
      // 超级管理员不能操作其他超级管理员
      if (targetUserRoles.includes('super_admin')) {
        throw new ForbiddenException('超级管理员不能操作其他超级管理员账户');
      }
    }
    // 如果当前用户是管理员
    else if (currentUserRoles.includes('admin')) {
      // 管理员不能操作超级管理员或其他管理员
      if (
        targetUserRoles.includes('super_admin') ||
        targetUserRoles.includes('admin')
      ) {
        throw new ForbiddenException('管理员只能操作普通用户账户');
      }
    }
    // 其他用户没有权限
    else {
      throw new ForbiddenException('没有足够的权限执行此操作');
    }
  }

  // 获取用户列表（带分页和权限过滤）
  async findAll(queryUserDto: QueryUserDto, currentUser: User) {
    const page = queryUserDto.page || 1;
    const limit = queryUserDto.limit || 10;
    
    let query = this.userRepository.createQueryBuilder('user');

    // 根据当前用户角色过滤可见用户
    if (currentUser.roles.includes('super_admin')) {
      // 超级管理员可以看到除超级管理员外的所有用户
      query = query.where(
        `NOT JSON_CONTAINS(user.roles, '"super_admin"', '$')`,
      );
    } else if (currentUser.roles.includes('admin')) {
      // 管理员只能看到普通用户
      query = query.where(
        `NOT JSON_CONTAINS(user.roles, '"super_admin"', '$') AND NOT JSON_CONTAINS(user.roles, '"admin"', '$')`,
      );
    } else {
      // 普通用户不能看到任何用户列表
      throw new ForbiddenException('没有权限查看用户列表');
    }

    // 添加角色筛选条件
    if (queryUserDto.role) {
      query = query.andWhere(
        `JSON_CONTAINS(user.roles, :role, '$')`,
        { role: JSON.stringify(queryUserDto.role) }
      );
    }

    // 计算分页
    const total = await query.getCount();
    const users = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: users,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  // 搜索用户（支持用户名模糊查询）
  async searchUsers(
    query: SearchUserDto,
    currentUser: User,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    // 创建查询构建器
    let queryBuilder = this.userRepository.createQueryBuilder('user');

    // 根据当前用户角色过滤可见用户
    if (currentUser.roles.includes('super_admin')) {
      // 超级管理员可以看到除超级管理员外的所有用户
      queryBuilder = queryBuilder.where(
        `NOT JSON_CONTAINS(user.roles, '"super_admin"', '$')`,
      );
    } else if (currentUser.roles.includes('admin')) {
      // 管理员只能看到普通用户
      queryBuilder = queryBuilder.where(
        `NOT JSON_CONTAINS(user.roles, '"super_admin"', '$') AND NOT JSON_CONTAINS(user.roles, '"admin"', '$')`,
      );
    } else {
      // 普通用户不能看到任何用户列表
      throw new ForbiddenException('没有权限查看用户列表');
    }

    // 添加用户名模糊查询条件
    if (query.username) {
      queryBuilder = queryBuilder.andWhere('user.username LIKE :username', {
        username: `%${query.username}%`,
      });
    }

    // 计算总数
    const total = await queryBuilder.getCount();

    // 添加排序和分页
    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: users,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  // 根据ID获取用户详情，添加权限检查
  async findOne(id: number, currentUser: User): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    // 检查是否有权限查看该用户
    this.checkUserRolePermission(
      currentUser.roles,
      user.roles,
      currentUser.id,
      user.id,
    );

    return user;
  }

  // 更新用户信息，添加权限检查
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    // 检查角色是否发生变更
    const originalRoles = user.roles || [];
    const newRoles = updateUserDto.roles || originalRoles;
    const hasRoleChanged = updateUserDto.roles && !this.compareArrays(originalRoles, newRoles);

    // 如果要修改角色，需要额外检查
    if (
      updateUserDto.roles &&
      !this.compareArrays(user.roles, updateUserDto.roles)
    ) {
      this.checkUserRolePermission(
        currentUser.roles,
        updateUserDto.roles,
        currentUser.id,
        user.id,
      );
    } else {
      // 检查基本权限
      this.checkUserRolePermission(
        currentUser.roles,
        user.roles,
        currentUser.id,
        user.id,
      );
    }

    // 如果要更新密码，需要重新加密
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 更新用户信息
    const updatedUser = this.userRepository.merge(user, updateUserDto);
    const savedUser = await this.userRepository.save(updatedUser);

    // 如果角色发生变更，清除报表缓存
    if (hasRoleChanged) {
      this.logger.log(`用户 ${id} 角色通过update方法发生变更，从 [${originalRoles.join(', ')}] 变更为 [${newRoles.join(', ')}]，准备清除报表缓存`);
      
      // 异步清除缓存，不阻塞主流程
      this.clearUserReportCache(id).catch(error => {
        this.logger.error(`清除用户 ${id} 报表缓存失败: ${error.message}`, error.stack);
      });
    }

    return savedUser;
  }

  // 更新用户个人资料（只允许更新idCardNumber和phone）
  async updateUserProfile(
    id: number,
    profileData: { idCardNumber?: string; phone?: string; avatar?: string },
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    // 检查身份证号是否已存在（如果要修改身份证号）
    if (
      profileData.idCardNumber !== undefined &&
      profileData.idCardNumber !== user.idCardNumber
    ) {
      const existingUserWithIdCard = await this.userRepository.findOne({
        where: { idCardNumber: profileData.idCardNumber },
      });
      if (existingUserWithIdCard) {
        throw new BadRequestException('身份证号已存在');
      }
    }

    // 更新idCardNumber、phone和avatar字段
    if (profileData.idCardNumber !== undefined) {
      user.idCardNumber = profileData.idCardNumber;
    }
    if (profileData.phone !== undefined) {
      user.phone = profileData.phone;
    }
    if (profileData.avatar !== undefined) {
      user.avatar = profileData.avatar;
    }

    return this.userRepository.save(user);
  }

  // 更新用户密码
  async updatePassword(id: number, newPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // 更新密码修改时间
    user.passwordUpdatedAt = new Date();

    // 保存更新后的用户信息
    return this.userRepository.save(user);
  }

  // 删除用户，添加权限检查
  async remove(id: number, currentUser: User): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    // 检查权限
    this.checkUserRolePermission(
      currentUser.roles,
      user.roles,
      currentUser.id,
      user.id,
    );

    await this.userRepository.remove(user);
  }

  // 比较两个数组是否相等
  private compareArrays(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) return false;
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return sortedArr1.every((val, idx) => val === sortedArr2[idx]);
  }

  // 为用户分配角色
  async assignRolesToUser(
    userId: number,
    roleNames: string[],
    currentUser: User,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 检查权限
    this.checkUserRolePermission(
      currentUser.roles,
      user.roles,
      currentUser.id,
      user.id,
    );

    // 验证所有角色是否存在
    for (const roleName of roleNames) {
      try {
        await this.roleService.findByName(roleName);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw new BadRequestException(`角色 ${roleName} 不存在`);
      }
    }

    // 检查角色是否发生变更
    const originalRoles = user.roles || [];
    const hasRoleChanged = !this.compareArrays(originalRoles, roleNames);

    // 更新用户角色
    user.roles = roleNames;

    const savedUser = await this.userRepository.save(user);

    // 如果角色发生变更，清除报表缓存
    if (hasRoleChanged) {
      this.logger.log(`用户 ${userId} 角色发生变更，从 [${originalRoles.join(', ')}] 变更为 [${roleNames.join(', ')}]，准备清除报表缓存`);
      
      // 异步清除缓存，不阻塞主流程
      this.clearUserReportCache(userId).catch(error => {
        this.logger.error(`清除用户 ${userId} 报表缓存失败: ${error.message}`, error.stack);
      });
    }

    return savedUser;
  }

  /**
   * 清除用户报表缓存
   * 当用户角色发生变更时调用
   */
  private async clearUserReportCache(userId: number): Promise<void> {
    try {
      // 这里需要调用报表模块的缓存清理服务
      // 由于避免循环依赖，我们通过HTTP请求的方式调用
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(`http://localhost:3000/api/reports/clear-role-change-cache/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.logger.log(`用户 ${userId} 报表缓存清除成功`);
      } else {
        this.logger.warn(`用户 ${userId} 报表缓存清除失败: HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`清除用户 ${userId} 报表缓存时发生错误: ${error.message}`, error.stack);
    }
  }

  // 检查用户是否有指定权限 (通过角色)
  async checkUserPermission(
    userId: number,
    permissionName: string,
    currentUser: User,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 检查权限
    this.checkUserRolePermission(
      currentUser.roles,
      user.roles,
      currentUser.id,
      user.id,
    );

    // 通过角色检查
    if (user.roles && user.roles.length > 0) {
      for (const roleName of user.roles) {
        try {
          const role = await this.roleService.findByName(roleName);
          const hasPermission = role.permissions.some(
            (p) => p.permission_name === permissionName && p.permission_value,
          );
          if (hasPermission) return true;
        } catch (error) {
          console.error(`检查角色 ${roleName} 权限失败:`, error);
        }
      }
    }

    return false;
  }

  async findUserWithDepartment(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['department'],
    });

    if (!user) {
      throw new NotFoundException(`用户ID为${id}的记录不存在`);
    }

    return user;
  }

  /**
   * 获取部门下的所有用户
   */
  async findUsersByDepartment(deptId: number): Promise<User[]> {
    return this.userRepository.find({
      where: { dept_id: deptId },
    });
  }

  /**
   * 更新用户状态（启用/禁用）
   * @param id 用户ID
   * @param isActive 是否启用
   * @returns 更新后的用户对象
   */
  async updateUserStatus(id: number, isActive: boolean): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    user.isActive = isActive;
    return this.userRepository.save(user);
  }

  /**
   * 设置用户薪资密码
   * @param userId 用户ID
   * @param salaryPassword 加密后的薪资密码
   * @returns 更新结果
   */
  async updateSalaryPassword(
    userId: number,
    salaryPasswordData: {
      salaryPassword: string;
      salaryPasswordUpdatedAt: Date;
    },
  ): Promise<void> {
    const result = await this.userRepository.update(userId, salaryPasswordData);

    if (result.affected === 0) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }
  }

  /**
   * 验证用户薪资密码
   * @param userId 用户ID
   * @param salaryPassword 原始薪资密码
   * @returns 是否验证成功
   */
  async validateSalaryPassword(
    userId: number,
    salaryPassword: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'salaryPassword'], // 只选择需要的字段
    });

    if (!user || !user.salaryPassword) {
      return false;
    }

    return bcrypt.compare(salaryPassword, user.salaryPassword);
  }

  /**
   * 检查用户是否设置了薪资密码
   * @param userId 用户ID
   * @returns 是否已设置薪资密码
   */
  async hasSalaryPassword(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'salaryPassword', 'salaryPasswordUpdatedAt'],
    });

    return !!(user && user.salaryPassword);
  }

  /**
   * 获取用户薪资密码信息（不包含密码本身）
   * @param userId 用户ID
   * @returns 薪资密码相关信息
   */
  async getSalaryPasswordInfo(userId: number): Promise<{
    hasPassword: boolean;
    lastUpdated: Date | null;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'salaryPassword', 'salaryPasswordUpdatedAt'],
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    return {
      hasPassword: !!user.salaryPassword,
      lastUpdated: user.salaryPasswordUpdatedAt || null,
    };
  }
}
