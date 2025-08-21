import { Injectable, Logger } from '@nestjs/common';
import ExcelJS from 'exceljs';

@Injectable()
export class ReportsExportService {
  private readonly logger = new Logger(ReportsExportService.name);

  /**
   * 导出Excel文件
   */
  async exportToExcel(
    reportType: string,
    data: any[],
    columns: ExcelColumn[],
    title: string,
    sheetName?: string
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // 设置工作簿属性，确保UTF-8编码
      workbook.creator = '中岳会计管理系统';
      workbook.lastModifiedBy = '中岳会计管理系统';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // 设置编码相关属性
      workbook.calcProperties.fullCalcOnLoad = true;
      
      const worksheet = workbook.addWorksheet(sheetName || title);

      // 设置工作表属性
      worksheet.properties.defaultRowHeight = 20;

      // 设置标题（合并单元格）
      const titleEndColumn = String.fromCharCode(65 + columns.length - 1);
      worksheet.mergeCells(`A1:${titleEndColumn}1`);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = title;
      titleCell.font = { 
        size: 16, 
        bold: true, 
        color: { argb: 'FF000000' } 
      };
      titleCell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
      };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };

      // 设置表头
      const headerRow = worksheet.addRow(columns.map(col => col.title));
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // 添加数据行
      data.forEach((item, index) => {
        const row = columns.map(col => {
          const value = this.getNestedValue(item, col.dataIndex);
          return this.formatCellValue(value, col.type);
        });
        
        const dataRow = worksheet.addRow(row);
        
        // 设置数据行样式
        dataRow.eachCell((cell, colNumber) => {
          const column = columns[colNumber - 1];
          
          // 数值类型右对齐，其他左对齐
          cell.alignment = {
            horizontal: column.type === 'number' || column.type === 'currency' ? 'right' : 'left',
            vertical: 'middle'
          };

          // 设置数值格式
          if (column.type === 'currency') {
            cell.numFmt = '"¥"#,##0.00';
          } else if (column.type === 'number') {
            cell.numFmt = '#,##0.00';
          } else if (column.type === 'percentage') {
            cell.numFmt = '0.00%';
          }
        });

        // 交替行背景色
        if (index % 2 === 1) {
          dataRow.eachCell(cell => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          });
        }
      });

      // 自动调整列宽
      worksheet.columns.forEach((column, index) => {
        const col = columns[index];
        column.width = col.width || this.calculateColumnWidth(col.title, data, col.dataIndex);
      });

      // 添加边框
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // 跳过标题行
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
            };
          });
        }
      });

      // 冻结首行（表头）
      worksheet.views = [{ state: 'frozen', ySplit: 2 }];

      // 使用UTF-8编码写入Buffer
      const buffer = await workbook.xlsx.writeBuffer({
        useSharedStrings: true,
        useStyles: true
      }) as Buffer;
      
      return buffer;
    } catch (error) {
      this.logger.error(`导出Excel失败: ${error.message}`, error.stack);
      throw new Error(`导出Excel失败: ${error.message}`);
    }
  }

  /**
   * 导出代理费收费变化分析报表
   */
  async exportAgencyFeeAnalysis(data: any): Promise<Buffer> {
    const columns: ExcelColumn[] = [
      { title: '客户ID', dataIndex: 'customerId', type: 'number', width: 12 },
      { title: '企业名称', dataIndex: 'companyName', type: 'text', width: 30 },
      { title: '统一社会信用代码', dataIndex: 'unifiedSocialCreditCode', type: 'text', width: 20 },
      { title: '今年费用', dataIndex: 'currentYearFee', type: 'currency', width: 15 },
      { title: '去年费用', dataIndex: 'previousYearFee', type: 'currency', width: 15 },
      { title: '减少金额', dataIndex: 'decreaseAmount', type: 'currency', width: 15 },
      { title: '减少比例', dataIndex: 'decreaseRate', type: 'percentage', width: 12 },
      { title: '顾问会计', dataIndex: 'consultantAccountant', type: 'text', width: 15 },
      { title: '记账会计', dataIndex: 'bookkeepingAccountant', type: 'text', width: 15 },
    ];

    return this.exportToExcel(
      'agency_fee_analysis',
      data.list || [],
      columns,
      '代理费收费变化分析报表',
      '代理费分析'
    );
  }

  /**
   * 导出新增客户统计报表
   */
  async exportNewCustomerStats(data: any): Promise<Buffer> {
    // 将按月统计的数据展开成明细数据
    const flatData = [];
    if (data.monthlyStats) {
      data.monthlyStats.forEach(monthStats => {
        monthStats.details.forEach(customer => {
          flatData.push({
            ...customer,
            month: monthStats.month
          });
        });
      });
    }

    const columns: ExcelColumn[] = [
      { title: '月份', dataIndex: 'month', type: 'text', width: 12 },
      { title: '客户ID', dataIndex: 'customerId', type: 'number', width: 12 },
      { title: '企业名称', dataIndex: 'companyName', type: 'text', width: 30 },
      { title: '统一社会信用代码', dataIndex: 'unifiedSocialCreditCode', type: 'text', width: 20 },
      { title: '创建时间', dataIndex: 'createTime', type: 'text', width: 18 },
      { title: '顾问会计', dataIndex: 'consultantAccountant', type: 'text', width: 15 },
      { title: '记账会计', dataIndex: 'bookkeepingAccountant', type: 'text', width: 15 },
      { title: '客户等级', dataIndex: 'customerLevel', type: 'text', width: 12 },
    ];

    return this.exportToExcel(
      'new_customer_stats',
      flatData,
      columns,
      '新增客户统计报表',
      '新增客户'
    );
  }

  /**
   * 导出员工业绩统计报表
   */
  async exportEmployeePerformance(data: any): Promise<Buffer> {
    const columns: ExcelColumn[] = [
      { title: '员工姓名', dataIndex: 'employeeName', type: 'text', width: 15 },
      { title: '部门', dataIndex: 'department', type: 'text', width: 20 },
      { title: '新增客户业绩', dataIndex: 'newCustomerRevenue', type: 'currency', width: 18 },
      { title: '续费业务业绩', dataIndex: 'renewalRevenue', type: 'currency', width: 18 },
      { title: '其他业务业绩', dataIndex: 'otherRevenue', type: 'currency', width: 18 },
      { title: '总业绩', dataIndex: 'totalRevenue', type: 'currency', width: 15 },
      { title: '服务客户数', dataIndex: 'customerCount', type: 'number', width: 12 },
    ];

    return this.exportToExcel(
      'employee_performance',
      data.employees || [],
      columns,
      '员工业绩统计报表',
      '员工业绩'
    );
  }

  /**
   * 导出客户等级分布统计报表
   */
  async exportCustomerLevelDistribution(data: any): Promise<Buffer> {
    const columns: ExcelColumn[] = [
      { title: '客户等级', dataIndex: 'level', type: 'text', width: 12 },
      { title: '客户数量', dataIndex: 'count', type: 'number', width: 12 },
      { title: '占比', dataIndex: 'percentage', type: 'percentage', width: 12 },
      { title: '贡献收入', dataIndex: 'revenue', type: 'currency', width: 18 },
    ];

    return this.exportToExcel(
      'customer_level_distribution',
      data.distribution || [],
      columns,
      '客户等级分布统计报表',
      '等级分布'
    );
  }

  /**
   * 导出会计负责客户数量统计报表
   */
  async exportAccountantClientStats(data: any): Promise<Buffer> {
    const columns: ExcelColumn[] = [
      { title: '会计姓名', dataIndex: 'accountantName', type: 'text', width: 15 },
      { title: '会计类型', dataIndex: 'accountantType', type: 'text', width: 15 },
      { title: '负责客户数量', dataIndex: 'clientCount', type: 'number', width: 15 },
      { title: '部门', dataIndex: 'department', type: 'text', width: 20 },
    ];

    return this.exportToExcel(
      'accountant_client_stats',
      data.accountants || [],
      columns,
      '会计负责客户数量统计报表',
      '会计客户统计'
    );
  }

  /**
   * 导出客户流失统计报表
   */
  async exportCustomerChurnStats(data: any): Promise<Buffer> {
    const columns: ExcelColumn[] = [
      { title: '客户名称', dataIndex: 'customerName', type: 'text', width: 20 },
      { title: '统一社会信用代码', dataIndex: 'creditCode', type: 'text', width: 20 },
      { title: '企业状态', dataIndex: 'enterpriseStatus', type: 'text', width: 12 },
      { title: '营业状态', dataIndex: 'businessStatus', type: 'text', width: 12 },
      { title: '流失时间', dataIndex: 'churnDate', type: 'date', width: 15 },
      { title: '流失原因', dataIndex: 'churnReason', type: 'text', width: 20 },
      { title: '客户等级', dataIndex: 'customerLevel', type: 'text', width: 12 },
      { title: '历史贡献', dataIndex: 'historicalContribution', type: 'currency', width: 15 },
    ];

    return this.exportToExcel(
      'customer_churn_stats',
      data.churnedCustomers || [],
      columns,
      '客户流失统计报表',
      '客户流失统计'
    );
  }

  /**
   * 导出代理服务到期客户统计报表
   */
  async exportServiceExpiryStats(data: any): Promise<Buffer> {
    const columns: ExcelColumn[] = [
      { title: '客户ID', dataIndex: 'customerId', type: 'number', width: 12 },
      { title: '代理结束日期', dataIndex: 'agencyEndDate', type: 'date', width: 15 },
    ];

    return this.exportToExcel(
      'service_expiry_stats',
      data.expiredCustomers || [],
      columns,
      '代理服务到期客户统计报表',
      '服务到期统计'
    );
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 格式化单元格值
   */
  private formatCellValue(value: any, type?: string): any {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type) {
      case 'currency':
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      case 'percentage':
        return typeof value === 'number' ? value / 100 : (parseFloat(value) || 0) / 100;
      default:
        return value.toString();
    }
  }

  /**
   * 计算列宽
   */
  private calculateColumnWidth(title: string, data: any[], dataIndex: string): number {
    let maxLength = title.length;
    
    data.slice(0, 100).forEach(item => { // 只检查前100行以提高性能
      const value = this.getNestedValue(item, dataIndex);
      if (value !== null && value !== undefined) {
        const length = value.toString().length;
        if (length > maxLength) {
          maxLength = length;
        }
      }
    });

    // 限制最小和最大宽度
    return Math.min(Math.max(maxLength + 2, 8), 50);
  }
}

/**
 * Excel列定义接口
 */
export interface ExcelColumn {
  title: string;
  dataIndex: string;
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  width?: number;
} 