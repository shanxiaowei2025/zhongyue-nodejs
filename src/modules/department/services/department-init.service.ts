import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';
import { initialDepartments } from '../data/initial-departments';
import { DepartmentService } from './department.service';

@Injectable()
export class DepartmentInitService implements OnModuleInit {
  private readonly logger = new Logger(DepartmentInitService.name);

  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    private departmentService: DepartmentService
  ) {}

  async onModuleInit() {
    // 等待角色和权限初始化完成后再初始化部门
    setTimeout(async () => {
      await this.initDepartments();
    }, 2000);
  }

  private async initDepartments() {
    try {
      // 检查是否已有部门数据
      const existingDepartments = await this.departmentRepository.find();
      
      if (existingDepartments.length === 0) {
        this.logger.log('初始化部门数据...');
        
        // 第一步：创建所有部门（不设置父子关系）
        const departments = new Map<number, Department>();
        
        for (const deptData of initialDepartments) {
          try {
            const dept = this.departmentRepository.create({
              name: deptData.name,
              sort: deptData.sort,
              phone: deptData.phone,
              principal: deptData.principal,
              email: deptData.email,
              status: deptData.status,
              type: deptData.type,
              remark: deptData.remark
            });
            
            const savedDept = await this.departmentRepository.save(dept);
            if (deptData.id) {
              departments.set(deptData.id, savedDept);
            }
            
            this.logger.log(`部门 "${deptData.name}" 创建成功`);
          } catch (error) {
            this.logger.error(`部门 "${deptData.name}" 创建失败: ${error.message}`);
          }
        }
        
        // 第二步：建立父子关系
        for (const deptData of initialDepartments) {
          if (deptData.id && deptData.parent_id && departments.has(deptData.id) && departments.has(deptData.parent_id)) {
            const dept = departments.get(deptData.id);
            const parent = departments.get(deptData.parent_id);
            
            try {
              dept.parent = parent;
              await this.departmentRepository.save(dept);
              this.logger.log(`部门 "${deptData.name}" 已设置父部门为 "${parent.name}"`);
            } catch (error) {
              this.logger.error(`为部门 "${deptData.name}" 设置父部门失败: ${error.message}`);
            }
          }
        }
        
        this.logger.log('部门初始化完成');
      } else {
        this.logger.log(`已存在 ${existingDepartments.length} 个部门，跳过初始化`);
      }
    } catch (error) {
      this.logger.error(`部门初始化过程出错: ${error.message}`);
    }
  }
} 