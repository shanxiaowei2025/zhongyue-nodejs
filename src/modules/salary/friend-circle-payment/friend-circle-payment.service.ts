import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Equal, Between, IsNull, Not } from 'typeorm';
import { FriendCirclePayment } from './entities/friend-circle-payment.entity';
import { CreateFriendCirclePaymentDto } from './dto/create-friend-circle-payment.dto';
import { UpdateFriendCirclePaymentDto } from './dto/update-friend-circle-payment.dto';
import { QueryFriendCirclePaymentDto } from './dto/query-friend-circle-payment.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';
import { Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as os from 'os';
import * as crypto from 'crypto';
import * as process from 'process';

@Injectable()
export class FriendCirclePaymentService {
  constructor(
    @InjectRepository(FriendCirclePayment)
    private readonly friendCirclePaymentRepo: Repository<FriendCirclePayment>,
  ) {}

  async create(createFriendCirclePaymentDto: CreateFriendCirclePaymentDto) {
    // 检查是否已存在相同姓名和年月的记录
    const existing = await this.friendCirclePaymentRepo.findOne({
      where: {
        name: createFriendCirclePaymentDto.name,
        yearMonth: createFriendCirclePaymentDto.yearMonth,
      },
    });

    if (existing) {
      throw new BadRequestException(`${createFriendCirclePaymentDto.name} 在 ${createFriendCirclePaymentDto.yearMonth} 已有记录`);
    }

    // 检查总数是否与每周数据一致
    const totalFromWeeks = 
      (createFriendCirclePaymentDto.weekOne || 0) + 
      (createFriendCirclePaymentDto.weekTwo || 0) + 
      (createFriendCirclePaymentDto.weekThree || 0) + 
      (createFriendCirclePaymentDto.weekFour || 0);
    
    if (createFriendCirclePaymentDto.totalCount && createFriendCirclePaymentDto.totalCount !== totalFromWeeks) {
      throw new BadRequestException(`总数 (${createFriendCirclePaymentDto.totalCount}) 与每周数据总和 (${totalFromWeeks}) 不一致`);
    }

    // 如果没有提供总数，则自动计算
    if (!createFriendCirclePaymentDto.totalCount) {
      createFriendCirclePaymentDto.totalCount = totalFromWeeks;
    }
    
    const friendCirclePayment = this.friendCirclePaymentRepo.create(createFriendCirclePaymentDto);
    return this.friendCirclePaymentRepo.save(friendCirclePayment);
  }

  async findAll(query: QueryFriendCirclePaymentDto, req: Request) {
    const { page = 1, pageSize = 10, name, isCompleted, yearMonth } = query;
    
    // 使用安全的分页参数
    const { page: safePage, pageSize: safePageSize } = safePaginationParams(page, pageSize);
    
    const queryBuilder = this.friendCirclePaymentRepo.createQueryBuilder('friendCirclePayment');
    
    // 姓名模糊查询
    if (name) {
      queryBuilder.andWhere('friendCirclePayment.name LIKE :name', { name: `%${name}%` });
    }
    
    // 是否完成精确匹配
    if (isCompleted !== undefined) {
      // 确保使用布尔值进行查询 - 这里将字符串类型也考虑进去
      let boolValue: boolean;
      if (typeof isCompleted === 'string') {
        boolValue = isCompleted === 'true';
      } else {
        boolValue = Boolean(isCompleted);
      }
      queryBuilder.andWhere('friendCirclePayment.isCompleted = :isCompleted', { isCompleted: boolValue });
    }
    
    // 年月查询 - 支持模糊查询
    if (yearMonth) {
      // 安全处理yearMonth参数
      const safeYearMonth = safeDateParam(yearMonth);
      if (safeYearMonth) {
        // 将日期转换为字符串格式 YYYY-MM-DD
        const yearMonthStr = typeof safeYearMonth === 'string' 
          ? safeYearMonth 
          : safeYearMonth.toISOString().split('T')[0];
        // 提取年月部分 YYYY-MM
        const yearMonthPart = yearMonthStr.substring(0, 7);
        
        // 使用DATE_FORMAT函数进行模糊查询
        queryBuilder.andWhere('DATE_FORMAT(friendCirclePayment.yearMonth, "%Y-%m") LIKE :yearMonth', 
          { yearMonth: `%${yearMonthPart}%` });
        console.log('使用年月模糊查询:', yearMonthPart);
      }
    }
    
    // 获取总记录数和分页数据
    const total = await queryBuilder.getCount();
      
    const data = await queryBuilder
        .orderBy('friendCirclePayment.yearMonth', 'DESC')
      .addOrderBy('friendCirclePayment.name', 'ASC')
      .skip((safePage - 1) * safePageSize)
      .take(safePageSize)
        .getMany();
    
    return {
      data,
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async findOne(id: number) {
    const friendCirclePayment = await this.friendCirclePaymentRepo.findOne({
      where: { id },
    });

    if (!friendCirclePayment) {
      throw new NotFoundException(`ID为${id}的朋友圈扣款记录不存在`);
    }

    return friendCirclePayment;
  }

  async update(id: number, updateFriendCirclePaymentDto: UpdateFriendCirclePaymentDto) {
    const friendCirclePayment = await this.findOne(id);

    // 如果更新了周数据，检查总数一致性
    if (
      updateFriendCirclePaymentDto.weekOne !== undefined ||
      updateFriendCirclePaymentDto.weekTwo !== undefined ||
      updateFriendCirclePaymentDto.weekThree !== undefined ||
      updateFriendCirclePaymentDto.weekFour !== undefined
    ) {
      const weekOne = updateFriendCirclePaymentDto.weekOne ?? friendCirclePayment.weekOne;
      const weekTwo = updateFriendCirclePaymentDto.weekTwo ?? friendCirclePayment.weekTwo;
      const weekThree = updateFriendCirclePaymentDto.weekThree ?? friendCirclePayment.weekThree;
      const weekFour = updateFriendCirclePaymentDto.weekFour ?? friendCirclePayment.weekFour;
      
      const totalFromWeeks = (weekOne || 0) + (weekTwo || 0) + (weekThree || 0) + (weekFour || 0);
      
      if (updateFriendCirclePaymentDto.totalCount !== undefined && 
          updateFriendCirclePaymentDto.totalCount !== totalFromWeeks) {
        throw new BadRequestException(`总数 (${updateFriendCirclePaymentDto.totalCount}) 与每周数据总和 (${totalFromWeeks}) 不一致`);
      }
      
      // 自动更新总数
      updateFriendCirclePaymentDto.totalCount = totalFromWeeks;
    }

    // 检查是否已存在相同姓名和年月的记录
    if (updateFriendCirclePaymentDto.name !== undefined && 
        updateFriendCirclePaymentDto.yearMonth !== undefined &&
        (updateFriendCirclePaymentDto.name !== friendCirclePayment.name || 
         updateFriendCirclePaymentDto.yearMonth !== friendCirclePayment.yearMonth)) {
      
      const existing = await this.friendCirclePaymentRepo.findOne({
        where: {
          name: updateFriendCirclePaymentDto.name,
          yearMonth: updateFriendCirclePaymentDto.yearMonth,
        },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(`${updateFriendCirclePaymentDto.name} 在 ${updateFriendCirclePaymentDto.yearMonth} 已有记录`);
      }
    }

    return this.friendCirclePaymentRepo.save({
      ...friendCirclePayment,
      ...updateFriendCirclePaymentDto,
    });
  }

  async remove(id: number) {
    const friendCirclePayment = await this.findOne(id);
    return this.friendCirclePaymentRepo.remove(friendCirclePayment);
  }

  async importData(file: Express.Multer.File) {
    try {
      // 使用Python脚本处理数据 - 使用绝对路径
      const rootDir = process.cwd();
      const scriptPath = path.join(rootDir, 'src/modules/salary/friend-circle-payment/utils/import_payment.py');
      console.log('Python脚本绝对路径:', scriptPath);
      const originalFilename = file.originalname;
      
      // 直接通过内存处理文件，不写入临时文件
      return new Promise<any>((resolve, reject) => {
        // 启动Python进程
        const pythonProcess = spawn('python3', [scriptPath, originalFilename, '--overwrite']);
        
        let stdoutData = '';
        let stderrData = '';
        
        // 将文件内容通过stdin传递给Python脚本
        pythonProcess.stdin.write(file.buffer);
        pythonProcess.stdin.end();
        
        // 收集标准输出
        pythonProcess.stdout.on('data', (data) => {
          stdoutData += data.toString();
        });
        
        // 收集标准错误
        pythonProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
          console.error(`Python脚本错误: ${data.toString()}`);
        });
        
        // 处理进程结束
        pythonProcess.on('close', async (code) => {
          if (code !== 0) {
            console.error(`Python脚本退出代码: ${code}`);
            return reject(new BadRequestException(`处理导入文件时发生错误: ${stderrData}`));
          }
          
          try {
            // 解析Python脚本的输出
            const result = JSON.parse(stdoutData);
            
            if (!result.success) {
              return reject(new BadRequestException(result.error || '导入失败'));
            }
            
            // 插入有效数据
            const importedCount = result.data.length;
            const failedCount = result.failedRecords.length;
            
            if (importedCount > 0) {
              // 检查是否是覆盖模式 - 从Python脚本结果中获取
              const overwriteMode = result.overwriteMode || false;
              
              if (overwriteMode) {
                for (const item of result.data) {
                  if (item.name && item.yearMonth) {
                    // 提取年月信息（YYYY-MM格式）
                    const yearMonthStr = item.yearMonth.toString().substring(0, 7);
                    
                    // 删除相同姓名和年月的现有记录
                    await this.friendCirclePaymentRepo
                      .createQueryBuilder()
                      .delete()
                      .where('name = :name', { name: item.name })
                      .andWhere('DATE_FORMAT(yearMonth, "%Y-%m") = :yearMonth', { yearMonth: yearMonthStr })
                      .execute();
                  }
                }
              }
              
              // 批量创建记录
              const entities = result.data.map(item => this.friendCirclePaymentRepo.create(item));
              await this.friendCirclePaymentRepo.save(entities);
            }
            
            resolve({
              success: true,
              message: `成功导入 ${importedCount} 条记录${failedCount > 0 ? `，${failedCount} 条记录失败` : ''}`,
              importedCount,
              failedCount,
              failedRecords: result.failedRecords,
            });
          } catch (error) {
            console.error('解析Python输出错误:', error);
            reject(new BadRequestException(`解析导入结果失败: ${error.message}`));
          }
        });
    
        // 处理进程错误
        pythonProcess.on('error', (error) => {
          console.error('Python进程错误:', error);
          reject(new BadRequestException(`执行Python脚本失败: ${error.message}`));
        });
      });
      
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('导入数据错误:', error);
      throw new BadRequestException(`导入失败: ${error.message}`);
    }
  }
} 