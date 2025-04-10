import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,  // 注入用户数据库操作工具
  ) {}

  // 根据用户名查找用户
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  // 根据用户ID查找用户
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // 创建新用户
  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }
}
