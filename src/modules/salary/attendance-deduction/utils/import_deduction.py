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

def import_attendance_deduction_data(file_path):
    try:
        debug_print("开始导入考勤扣款数据函数")
        debug_print(f"Python版本: {sys.version}")
        debug_print(f"当前工作目录: {os.getcwd()}")
        debug_print(f"命令行参数: {sys.argv}")
        
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
                '考勤扣款': 'attendanceDeduction',
                '全勤奖励': 'fullAttendanceBonus',
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
                'attendanceDeduction', 'fullAttendanceBonus'
            ]
            
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
            if db_data.empty:
                print("没有可导入的有效记录")
                error_message = "没有可导入的有效记录"
                success = False
            else:
                try:
                    # 将数据导入到数据库表
                    print("开始导入数据到数据库...")
                    db_data.to_sql('sys_attendance_deduction', engine, if_exists='append', index=False)
                    print("数据导入成功!")
                except Exception as e:
                    success = False
                    error_message = str(e)
                    print(f"导入数据到数据库失败: {error_message}")
                    traceback.print_exc()
            
            # 准备结果对象
            result = {
                'success': success and len(db_data) > 0,
                'imported_count': len(db_data) if success else 0,
                'failed_count': len(validation_errors),
                'failed_records': validation_errors,
                'error_message': error_message
            }
            
            # 输出JSON格式结果，便于Node.js解析
            print(f"IMPORT_RESULT_JSON: {json.dumps(result)}")
            
            return success

        except Exception as e:
            error_msg = f"处理文件失败: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            error_info = {
                "success": False,
                "error_type": "file_processing",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

    except Exception as e:
        error_msg = f"导入数据异常: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        error_info = {
            "success": False,
            "error_type": "unknown_error",
            "error_message": error_msg,
            "failed_records": []
        }
        print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
        return False

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='导入考勤扣款数据')
    parser.add_argument('--file', type=str, required=True, help='要导入的CSV或Excel文件路径')
    args = parser.parse_args()
    
    # 执行导入
    success = import_attendance_deduction_data(args.file)
    
    # 返回结果代码
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 