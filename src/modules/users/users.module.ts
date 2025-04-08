import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UserInitService } from './services/user-init.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserInitService],
  exports: [UsersService],
})
export class UsersModule {}
