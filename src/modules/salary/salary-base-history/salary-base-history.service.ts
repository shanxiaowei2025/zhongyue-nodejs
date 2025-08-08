import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryBaseHistory } from './entities/salary-base-history.entity';
import { QuerySalaryBaseHistoryDto } from './dto/query-salary-base-history.dto';

@Injectable()
export class SalaryBaseHistoryService {
  constructor(
    @InjectRepository(SalaryBaseHistory)
    private readonly salaryBaseHistoryRepository: Repository<SalaryBaseHistory>,
  ) {}

  /**
   * 记录员工底薪变更历史
   * @param employeeName 员工姓名
   * @param beforeBaseSalary 调整前底薪
   * @param afterBaseSalary 调整后底薪
   * @param modifiedBy 修改人
   */
  async recordBaseSalaryChange(
    employeeName: string,
    beforeBaseSalary: number,
    afterBaseSalary: number,
    modifiedBy: string,
  ): Promise<SalaryBaseHistory> {
    // 创建新的历史记录
    const history = this.salaryBaseHistoryRepository.create({
      employeeName,
      beforeBaseSalary,
      afterBaseSalary,
      modifiedBy,
    });

    // 保存记录
    return await this.salaryBaseHistoryRepository.save(history);
  }

  /**
   * 获取员工底薪变更历史记录
   * @param employeeName 员工姓名（可选）
   */
  async findHistory(employeeName?: string) {
    const queryBuilder =
      this.salaryBaseHistoryRepository.createQueryBuilder('history');

    // 如果提供了员工姓名，则按姓名筛选
    if (employeeName) {
      queryBuilder.where('history.employeeName LIKE :name', {
        name: `%${employeeName}%`,
      });
    }

    // 按修改时间降序排列
    queryBuilder.orderBy('history.modifiedAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * 查询工资基数历程记录
   * @param query 查询条件
   * @returns 工资基数历程记录列表
   */
  async findAll(query: QuerySalaryBaseHistoryDto) {
    const { employeeName, modifiedBy, startDate, endDate } = query;
    const queryBuilder =
      this.salaryBaseHistoryRepository.createQueryBuilder('history');

    // 条件查询构建
    if (employeeName) {
      queryBuilder.andWhere('history.employeeName LIKE :employeeName', {
        employeeName: `%${employeeName}%`,
      });
    }

    if (modifiedBy) {
      queryBuilder.andWhere('history.modifiedBy LIKE :modifiedBy', {
        modifiedBy: `%${modifiedBy}%`,
      });
    }

    if (startDate) {
      queryBuilder.andWhere('history.modifiedAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('history.modifiedAt <= :endDate', { endDate });
    }

    // 按修改时间降序排列
    queryBuilder.orderBy('history.modifiedAt', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder.getMany();

    return {
      total,
      data,
    };
  }
}
