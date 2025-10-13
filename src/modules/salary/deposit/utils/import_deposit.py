#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
from sqlalchemy import create_engine, text
import numpy as np
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

def import_deposit_data(file_path, overwrite_mode=False):
    try:
        debug_print("开始导入保证金数据函数")
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
            if file_ext == '.csv':
                # 尝试不同的编码方式读取CSV
                encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030']
                df = None
                
                for encoding in encodings:
                    try:
                        df = pd.read_csv(file_path, encoding=encoding)
                        print(f"成功使用 {encoding} 编码读取CSV文件")
                        break
                    except Exception as e:
                        print(f"使用 {encoding} 编码读取失败: {str(e)}")
                
                if df is None:
                    raise Exception("无法读取CSV文件，尝试了多种编码方式均失败")
            elif file_ext in ['.xlsx', '.xls']:
                df = pd.read_excel(file_path)
            else:
                error_msg = f"不支持的文件格式: {file_ext}，请上传 .csv, .xlsx 或 .xls 文件"
                print(error_msg)
                error_info = {
                    "success": False,
                    "error_type": "unsupported_format",
                    "error_message": error_msg,
                    "failed_records": []
                }
                print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                return False
        except Exception as e:
            error_msg = f"读取文件失败: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            error_info = {
                "success": False,
                "error_type": "file_read_error",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

        # 显示读取到的数据
        print(f"成功读取文件，共 {len(df)} 行数据")
        debug_print(f"数据前5行:\n{df.head()}")
        debug_print(f"列名: {list(df.columns)}")

        # 检查必要字段是否存在
        required_columns = ['姓名', '保证金扣除', '扣除日期']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            error_msg = f"缺少必要的列: {', '.join(missing_columns)}"
            print(error_msg)
            print(f"文件包含的列: {', '.join(df.columns)}")
            error_info = {
                "success": False,
                "error_type": "missing_columns",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

        # 数据清洗和转换
        # 1. 处理空值
        df = df.replace({np.nan: None})
        
        # 2. 转换日期格式
        def parse_date(date_str):
            if pd.isnull(date_str) or date_str is None:
                return None
                
            if isinstance(date_str, (datetime, pd.Timestamp)):
                return date_str.strftime('%Y-%m-%d')
                
            try:
                # 处理字符串格式的日期
                if isinstance(date_str, str):
                    # 尝试直接解析
                    try:
                        dt = pd.to_datetime(date_str)
                        return dt.strftime('%Y-%m-%d')
                    except:
                        pass
                    
                    # 尝试不同的日期格式
                    date_formats = ['%Y-%m-%d', '%Y/%m/%d', '%Y%m%d', '%Y.%m.%d', '%d-%m-%Y', '%d/%m/%Y']
                    for fmt in date_formats:
                        try:
                            dt = datetime.strptime(date_str, fmt)
                            return dt.strftime('%Y-%m-%d')
                        except:
                            continue
                            
                return None
            except Exception as e:
                print(f"日期解析失败: {date_str}, 错误: {e}")
                return None
        
        # 应用日期转换
        df['扣除日期'] = df['扣除日期'].apply(parse_date)
        
        # 显示数据转换后的结果
        debug_print(f"数据清洗后，前5行:\n{df.head()}")
        
        # ========== 时间验证：只能导入上个月的数据 ==========
        # 获取当前日期和上个月的年月
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        # 计算上个月的年月
        if current_month == 1:
            last_month = 12
            last_year = current_year - 1
        else:
            last_month = current_month - 1
            last_year = current_year
        
        # 格式化为YYYY-MM格式
        last_month_str = f"{last_year:04d}-{last_month:02d}"
        
        print(f"时间验证: 当前年月={current_year:04d}-{current_month:02d}, 允许导入的年月={last_month_str}")
        
        # 验证所有记录的年月
        invalid_dates = []
        for index, row in df.iterrows():
            deduction_date = row.get('扣除日期')
            if deduction_date:
                # 提取年月 (YYYY-MM)
                date_year_month = deduction_date[:7]
                if date_year_month != last_month_str:
                    invalid_dates.append({
                        "row": index + 1,
                        "name": row.get('姓名', '未知'),
                        "date": deduction_date,
                        "year_month": date_year_month
                    })
        
        # 如果存在不符合要求的日期，返回错误
        if invalid_dates:
            error_msg = f"只能导入上个月数据，导入失败。"
            print(error_msg)
            
            # 显示前几条无效记录的详细信息
            sample_invalid = invalid_dates[:5]
            print(f"无效日期示例: {sample_invalid}")
            
            error_info = {
                "success": False,
                "error_type": "invalid_date_range",
                "error_message": error_msg,
                "allowed_month": last_month_str,
                "invalid_dates": invalid_dates,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info, ensure_ascii=False)}")
            return False
        
        print(f"时间验证通过: 所有记录的日期都是上个月({last_month_str})")
        # ========== 时间验证结束 ==========
        
        # 定义失败记录和成功计数
        failed_records = []
        success_count = 0
        
        # 开始插入数据
        print("开始导入数据到数据库...")
        
        with engine.begin() as conn:
            for index, row in df.iterrows():
                try:
                    # 检查姓名和日期是否为空
                    if not row['姓名'] or not row['扣除日期']:
                        failed_records.append({
                            "row": index + 1,
                            "data": row.to_dict(),
                            "error": "姓名或扣除日期为空"
                        })
                        continue
                    
                    # 格式化保证金金额
                    amount = 0
                    try:
                        amount = float(row['保证金扣除'])
                    except (ValueError, TypeError):
                        failed_records.append({
                            "row": index + 1,
                            "data": row.to_dict(),
                            "error": "保证金扣除金额格式错误"
                        })
                        continue
                    
                    # 处理备注字段
                    remark = row.get('备注', None)
                    
                    # 提取年月信息（YYYY-MM格式）
                    deduction_date = row['扣除日期']
                    year_month = deduction_date[:7]  # 提取YYYY-MM部分
                    
                    # 如果是覆盖模式，先删除相同姓名和年月的现有记录
                    if overwrite_mode:
                        delete_sql = text("""
                            DELETE FROM sys_deposit 
                            WHERE name = :name 
                            AND DATE_FORMAT(deductionDate, '%Y-%m') = :year_month
                        """)
                        delete_params = {
                            'name': row['姓名'],
                            'year_month': year_month
                        }
                        
                        result = conn.execute(delete_sql, delete_params)
                        deleted_count = result.rowcount
                        if deleted_count > 0:
                            debug_print(f"删除了 {deleted_count} 条现有记录 (姓名: {row['姓名']}, 年月: {year_month})")
                    
                    # 构建插入SQL
                    insert_sql = text("""
                        INSERT INTO sys_deposit 
                        (name, amount, deductionDate, remark, createdAt, updatedAt) 
                        VALUES (:name, :amount, :deductionDate, :remark, NOW(), NOW())
                    """)
                    
                    # 执行插入
                    params = {
                        'name': row['姓名'],
                        'amount': amount,
                        'deductionDate': row['扣除日期'],
                        'remark': remark
                    }
                    
                    # 执行插入
                    conn.execute(insert_sql, params)
                    success_count += 1
                    
                except Exception as e:
                    print(f"插入第 {index+1} 行数据失败: {str(e)}")
                    traceback.print_exc()
                    failed_records.append({
                        "row": index + 1,
                        "data": row.to_dict(),
                        "error": str(e)
                    })
        
        # 生成导入结果
        result = {
            "success": True,
            "total": len(df),
            "imported": success_count,
            "failed": len(failed_records),
            "failed_records": failed_records
        }
        
        print(f"导入完成: 总共 {len(df)} 条记录，成功导入 {success_count} 条，失败 {len(failed_records)} 条")
        print(f"IMPORT_RESULT_JSON: {json.dumps(result)}")
        
        return True
        
    except Exception as e:
        error_msg = f"导入过程发生未预期的错误: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        error_info = {
            "success": False,
            "error_type": "unexpected_error",
            "error_message": error_msg,
            "failed_records": []
        }
        print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
        return False

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='导入保证金数据')
    parser.add_argument('--file', required=True, help='CSV或Excel文件路径')
    parser.add_argument('--overwrite', action='store_true', help='如果存在相同姓名和年月的记录，则覆盖')
    args = parser.parse_args()
    
    # 执行导入并根据结果设置退出码
    success = import_deposit_data(args.file, args.overwrite)
    if not success:
        sys.exit(1)  # 导入失败，返回非零退出码
    sys.exit(0)  # 导入成功

if __name__ == "__main__":
    main() 