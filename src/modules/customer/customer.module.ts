// 这是模块的入口文件，负责组织和配置该模块的所有组件
// 主要功能：
// 1. 导入需要的依赖模块（如 TypeOrmModule）
// 2. 声明该模块的控制器（Controller）
// 3. 声明该模块的服务（Service）
// 4. 导出可能被其他模块使用的服务
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { Customer } from './entities/customer.entity';
import { CustomerInitService } from './services/customer-init.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])], // 导入客户数据表
  controllers: [CustomerController],               // 处理HTTP请求的控制器
  providers: [CustomerService, CustomerInitService], // 提供业务逻辑的服务
  exports: [CustomerService],                       // 允许其他模块使用客户服务
})
export class CustomerModule {} 