import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users.service';

@Injectable()
export class UserInitService implements OnModuleInit {
  private readonly logger = new Logger(UserInitService.name);

  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    await this.initAdminUser();
  }

  private async initAdminUser() {
    try {
      const adminUsername = '管理员';
      const existingAdmin = await this.usersService.findByUsername(adminUsername);
      
      if (!existingAdmin) {
        await this.usersService.createUser({
          username: adminUsername,
          password: 'ls231007',  // 初始密码
          roles: ['admin', 'user'],  // 使用数组格式
          isActive: true,
          email: 'admin@example.com'
        });
        this.logger.log('管理员账户已初始化');
      }
    } catch (error) {
      this.logger.error('初始化管理员账户失败', error);
    }
  }
}
