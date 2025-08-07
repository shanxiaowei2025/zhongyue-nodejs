#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd # type: ignore
from sqlalchemy import create_engine, text # type: ignore
import numpy as np # type: ignore
import os
from datetime import datetime
import argparse
import sys
import traceback
import json
import urllib.parse

# 设置调试模式
DEBUG = True

def debug_print(message):
    """打印调试信息"""
    if DEBUG:
        print(f"DEBUG: {message}")

def import_insurance_data(file_path, overwrite_mode=False):
    try:
        debug_print("开始导入社保信息数据函数")
        debug_print(f"Python版本: {sys.version}")
        debug_print(f"当前工作目录: {os.getcwd()}")
        debug_print(f"命令行参数: {sys.argv}")
        debug_print(f"覆盖模式: {overwrite_mode}")
        
        # 配置数据库连接
        # 从环境变量获取数据库连接信息
        DB_HOST = os.environ.get('DB_HOST', '')
        DB_PORT = os.environ.get('DB_PORT', '')
        DB_NAME = os.environ.get('DB_DATABASE', '')
        DB_USER = os.environ.get('DB_USERNAME', '')
        # 对密码进行 URL 编码，防止特殊字符（如 @）导致连接失败
        DB_PASS = urllib.parse.quote_plus(os.environ.get('DB_PASSWORD', ''))

        # 输出数据库连接信息（不包含密码）
        debug_print(f"数据库连接信息: Host={DB_HOST}, Port={DB_PORT}, Name={DB_NAME}, User={DB_USER}")

        # 验证数据库配置
        if not DB_NAME or not DB_USER or not DB_PASS:
            error_msg = "错误: 缺少数据库连接信息，请检查环境变量配置"
            print(error_msg)
            error_info = {
                "success": False,
                "error_type": "database_connection",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

        try:
            # 创建数据库连接
            connection_string = f'mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
            print(f"尝试连接数据库...")
            debug_print(f"连接字符串(不含密码): mysql+pymysql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
            engine = create_engine(connection_string)
            
            # 测试连接
            with engine.connect() as conn:
                print(f"数据库连接成功")
        except Exception as e:
            error_msg = f"数据库连接失败: {str(e)}"
            print(error_msg)
            print(f"连接字符串(不含密码): mysql+pymysql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
            traceback.print_exc()
            error_info = {
                "success": False,
                "error_type": "database_connection",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

        # 读取Excel文件
        print(f"开始读取文件: {file_path}")
        debug_print(f"尝试读取文件: {file_path}")
        debug_print(f"文件是否存在: {os.path.exists(file_path)}")
        debug_print(f"文件大小: {os.path.getsize(file_path) if os.path.exists(file_path) else '文件不存在'}")

        # 检查文件是否存在
        if not os.path.exists(file_path):
            error_msg = f"错误: 文件 {file_path} 不存在"
            print(error_msg)
            error_info = {
                "success": False,
                "error_type": "file_not_found",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

        try:
            # 根据文件扩展名选择不同的读取方式
            file_ext = os.path.splitext(file_path)[1].lower()
            print(f"文件扩展名: {file_ext}")
            
            if file_ext == '.csv':
                # 读取CSV文件
                print(f"检测到CSV文件，使用pandas.read_csv读取")
                df = pd.read_csv(file_path, encoding='utf-8')
                # 尝试不同的编码方式（如果UTF-8失败）
                if df.empty or len(df.columns) == 0:
                    print("尝试使用GBK编码读取CSV文件")
                    df = pd.read_csv(file_path, encoding='gbk')
            else:
                # 读取Excel文件
                print(f"检测到Excel文件，使用pandas.read_excel读取")
                df = pd.read_excel(file_path, engine='openpyxl')
            
            print(f"成功读取文件，包含 {len(df)} 行数据")
            
            # 显示前几行数据以检查
            print("数据预览:")
            print(df.head())
            
            # 获取列名
            debug_print("Excel列名: " + ", ".join(df.columns.tolist()))
            
            # 创建一个新的DataFrame用于导入数据库
            db_data = pd.DataFrame()
            
            # 根据实体定义创建完整的映射关系
            column_mapping = {
                '姓名': 'name',
                '个人医疗': 'personalMedical',
                '个人养老': 'personalPension',
                '个人失业': 'personalUnemployment',
                '社保个人合计': 'personalTotal',
                '公司医疗': 'companyMedical',
                '公司养老': 'companyPension',
                '公司失业': 'companyUnemployment',
                '公司工伤': 'companyInjury',
                '公司承担合计': 'companyTotal',
                '总合计': 'grandTotal',
                '年月': 'yearMonth',
                '备注': 'remark'
            }
            
            # 遍历映射关系，将Excel数据映射到数据库字段
            for excel_col, db_col in column_mapping.items():
                if excel_col in df.columns:
                    db_data[db_col] = df[excel_col]
                    debug_print(f"映射列: {excel_col} -> {db_col}")
                else:
                    debug_print(f"警告: Excel中未找到列 '{excel_col}'")
                    db_data[db_col] = None
            
            # 添加默认值
            current_time = datetime.now()
            db_data['createdAt'] = current_time
            db_data['updatedAt'] = current_time
            
            # 检查和收集数据验证错误
            validation_errors = []
            valid_records = []
            
            # 数值字段列表
            numeric_fields = [
                'personalMedical', 'personalPension', 'personalUnemployment', 'personalTotal',
                'companyMedical', 'companyPension', 'companyUnemployment', 'companyInjury',
                'companyTotal', 'grandTotal'
            ]
            
            # 自动计算合计
            db_data = calculate_totals(db_data)
            
            # 检查每条记录
            for index, row in db_data.iterrows():
                row_errors = []
                
                # 检查姓名是否为空（必填字段）
                if pd.isna(row.get('name')) or not row.get('name'):
                    row_errors.append("姓名不能为空")
                
                # 检查数值字段
                for field in numeric_fields:
                    if field in row and not pd.isna(row[field]):
                        try:
                            # 确保是数值类型
                            row[field] = float(row[field])
                        except:
                            row_errors.append(f"{field}必须是数值类型")
                
                # 处理年月字段
                if 'yearMonth' in row and not pd.isna(row['yearMonth']):
                    try:
                        # 尝试转换为日期
                        if isinstance(row['yearMonth'], str):
                            row['yearMonth'] = pd.to_datetime(row['yearMonth'])
                    except:
                        row_errors.append(f"年月格式错误：'{row['yearMonth']}'不是有效的日期格式")
                
                # 收集此行的所有错误
                if row_errors:
                    validation_errors.append({
                        'index': index,
                        'row': index + 2,  # Excel行号从1开始，且有标题行
                        'name': row.get('name', '未知姓名'),
                        'errors': row_errors,
                        'reason': '数据验证失败: ' + '; '.join(row_errors)
                    })
                else:
                    # 只添加没有错误的记录
                    valid_records.append(row.to_dict())
            
            # 将有效记录转换为DataFrame
            if valid_records:
                db_data = pd.DataFrame(valid_records)
            else:
                db_data = pd.DataFrame()
            
            # 替换NaN为None(NULL)
            if not db_data.empty:
                db_data = db_data.replace({np.nan: None})
            
            # 输出准备导入的数据
            print(f"准备导入 {len(db_data)} 条记录到数据库")
            print(f"发现 {len(validation_errors)} 条无效记录")
            
            # 导入过滤后的数据
            success = True
            error_message = ""
            imported_count = 0
            
            if db_data.empty:
                print("没有可导入的有效记录")
                error_message = "没有可导入的有效记录"
                success = False
            else:
                try:
                    # 将数据导入到数据库表
                    print("开始导入数据到数据库...")
                    
                    with engine.begin() as conn:
                        for index, row in db_data.iterrows():
                            try:
                                # 如果是覆盖模式，先删除相同姓名和年月的现有记录
                                if overwrite_mode and row['name'] and row['yearMonth']:
                                    # 提取年月信息（YYYY-MM格式）
                                    year_month_str = str(row['yearMonth'])[:7]  # 提取YYYY-MM部分
                                    
                                    delete_sql = text("""
                                        DELETE FROM sys_social_insurance 
                                        WHERE name = :name 
                                        AND DATE_FORMAT(yearMonth, '%Y-%m') = :year_month
                                    """)
                                    delete_params = {
                                        'name': row['name'],
                                        'year_month': year_month_str
                                    }
                                    
                                    result = conn.execute(delete_sql, delete_params)
                                    deleted_count = result.rowcount
                                    if deleted_count > 0:
                                        debug_print(f"删除了 {deleted_count} 条现有记录 (姓名: {row['name']}, 年月: {year_month_str})")
                                
                                # 构建插入SQL
                                insert_sql = text("""
                                    INSERT INTO sys_social_insurance 
                                    (name, personalMedical, personalPension, personalUnemployment, personalTotal,
                                     companyMedical, companyPension, companyUnemployment, companyInjury, companyTotal,
                                     grandTotal, yearMonth, remark, createdAt, updatedAt) 
                                    VALUES (:name, :personalMedical, :personalPension, :personalUnemployment, :personalTotal,
                                            :companyMedical, :companyPension, :companyUnemployment, :companyInjury, :companyTotal,
                                            :grandTotal, :yearMonth, :remark, NOW(), NOW())
                                """)
                                
                                # 执行插入
                                params = {
                                    'name': row['name'],
                                    'personalMedical': row['personalMedical'] or 0,
                                    'personalPension': row['personalPension'] or 0,
                                    'personalUnemployment': row['personalUnemployment'] or 0,
                                    'personalTotal': row['personalTotal'] or 0,
                                    'companyMedical': row['companyMedical'] or 0,
                                    'companyPension': row['companyPension'] or 0,
                                    'companyUnemployment': row['companyUnemployment'] or 0,
                                    'companyInjury': row['companyInjury'] or 0,
                                    'companyTotal': row['companyTotal'] or 0,
                                    'grandTotal': row['grandTotal'] or 0,
                                    'yearMonth': row['yearMonth'],
                                    'remark': row.get('remark', None)
                                }
                                
                                conn.execute(insert_sql, params)
                                imported_count += 1
                                
                            except Exception as row_error:
                                print(f"插入第 {index + 1} 行数据失败: {str(row_error)}")
                                # 继续处理下一行，不中断整个导入过程
                                
                    print(f"数据导入成功! 共导入 {imported_count} 条记录")
                    
                except Exception as e:
                    success = False
                    error_message = str(e)
                    print(f"导入数据到数据库失败: {error_message}")
                    traceback.print_exc()
            
            # 准备结果对象
            result = {
                'success': success and imported_count > 0,
                'imported_count': imported_count if success else 0,
                'failed_count': len(validation_errors),
                'failed_records': validation_errors,
                'error_message': error_message
            }
            
            # 输出JSON格式结果，便于Node.js解析
            print(f"IMPORT_RESULT_JSON: {json.dumps(result)}")
            
            return result

        except Exception as e:
            error_msg = f"导入过程中出错: {str(e)}"
            print(error_msg)
            print(f"错误类型: {type(e).__name__}")
            traceback.print_exc()
            
            # 返回详细错误信息
            error_info = {
                "success": False,
                "error_type": "processing_error",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False
    
    except Exception as outer_error:
        print(f"致命错误: {str(outer_error)}")
        traceback.print_exc()
        error_info = {
            "success": False,
            "error_type": "fatal_error",
            "error_message": str(outer_error),
            "failed_records": []
        }
        print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
        return False

def calculate_totals(data):
    """
    计算个人合计、公司合计和总合计
    如果已提供这些字段则保留，否则根据其他字段计算
    """
    # 确保所有数值字段是浮点数
    numeric_fields = [
        'personalMedical', 'personalPension', 'personalUnemployment', 'personalTotal',
        'companyMedical', 'companyPension', 'companyUnemployment', 'companyInjury',
        'companyTotal', 'grandTotal'
    ]
    
    for field in numeric_fields:
        if field in data.columns:
            data[field] = pd.to_numeric(data[field], errors='coerce').fillna(0)
    
    # 计算各个合计
    for index, row in data.iterrows():
        # 计算个人合计
        if pd.isna(row.get('personalTotal')) or row.get('personalTotal') == 0:
            personal_medical = row.get('personalMedical', 0) or 0
            personal_pension = row.get('personalPension', 0) or 0
            personal_unemployment = row.get('personalUnemployment', 0) or 0
            
            personal_total = round(personal_medical + personal_pension + personal_unemployment, 2)
            data.at[index, 'personalTotal'] = personal_total
        else:
            personal_total = row.get('personalTotal', 0)
        
        # 计算公司承担合计
        if pd.isna(row.get('companyTotal')) or row.get('companyTotal') == 0:
            company_medical = row.get('companyMedical', 0) or 0
            company_pension = row.get('companyPension', 0) or 0
            company_unemployment = row.get('companyUnemployment', 0) or 0
            company_injury = row.get('companyInjury', 0) or 0
            
            company_total = round(company_medical + company_pension + company_unemployment + company_injury, 2)
            data.at[index, 'companyTotal'] = company_total
        else:
            company_total = row.get('companyTotal', 0)
        
        # 总是重新计算总合计，确保数据一致性
        # 使用已计算的个人合计和公司合计
        grand_total = round(personal_total + company_total, 2)
        data.at[index, 'grandTotal'] = grand_total
    
    return data

def main():
    try:
        # 创建命令行参数解析器
        parser = argparse.ArgumentParser(description='导入社保信息数据到数据库')
        parser.add_argument('--file', type=str, help='Excel/CSV文件路径')
        parser.add_argument('--overwrite', action='store_true', help='如果目标表已存在，则覆盖现有数据')
        args = parser.parse_args()
        
        # 获取文件路径
        if args.file:
            file_path = args.file
        else:
            print("错误: 未指定文件路径")
            sys.exit(1)
        
        # 导入数据
        print(f"开始导入文件: {file_path}")
        result = import_insurance_data(file_path, args.overwrite)
        
        # 返回结果状态码
        if result and isinstance(result, dict):
            # 打印导入结果摘要
            if result.get('success'):
                print(f"导入完成: 成功导入 {result.get('imported_count')} 条记录")
                if result.get('failed_count', 0) > 0:
                    print(f"有 {result.get('failed_count')} 条记录导入失败")
                sys.exit(0)
            else:
                sys.exit(1)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"主函数异常: {str(e)}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 