import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users.service';

@Injectable()
export class UserInitService implements OnModuleInit {
  private readonly logger = new Logger(UserInitService.name);

  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    setTimeout(async () => {
      await this.initAdminUser();
    }, 5000);
  }

  private async initAdminUser() {
    try {
      const adminUsername = '超级管理员';
      const existingAdmin = await this.usersService.findByUsername(adminUsername);
      
      if (!existingAdmin) {
        await this.usersService.create({
          username: adminUsername,
          password: 'ls231007',  // 初始密码
          roles: [ "super_admin"],  // 使用数组格式
          isActive: true,
          email: 'super_admin@example.com',
          dept_id: 2
        });
        this.logger.log('超级管理员账户已初始化');
      }
    } catch (error) {
      this.logger.error('初始化超级管理员账户失败', error);
    }
  }
}
