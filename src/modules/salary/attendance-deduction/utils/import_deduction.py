#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd # type: ignore
from sqlalchemy import create_engine, text # type: ignore
import numpy as np # type: ignore
import os
from datetime import datetime
from dateutil.relativedelta import relativedelta
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

def validate_date_range(df, date_column):
    """
    验证数据中的日期是否为上个月
    
    参数:
        df: DataFrame对象
        date_column: 日期列名
    
    返回:
        (is_valid, error_message, invalid_records)
    """
    # 计算上个月的年月
    current_date = datetime.now()
    last_month = current_date - relativedelta(months=1)
    expected_year_month = last_month.strftime("%Y-%m")
    
    invalid_records = []
    
    # 检查每条记录的日期
    for idx, row in df.iterrows():
        if date_column in df.columns:
            date_value = row[date_column]
            if pd.notna(date_value):  # 只检查非空值
                try:
                    # 尝试解析日期
                    if isinstance(date_value, str):
                        # 提取年月部分 (YYYY-MM)
                        date_str = date_value.strip()
                        if len(date_str) >= 7:
                            year_month = date_str[:7]
                        else:
                            year_month = date_str
                    else:
                        # 如果是日期对象，转换为字符串
                        year_month = pd.to_datetime(date_value).strftime("%Y-%m")
                    
                    # 检查是否为上个月
                    if year_month != expected_year_month:
                        invalid_records.append({
                            "row": idx + 2,  # 考虑表头行
                            "date": year_month,
                            "expected": expected_year_month
                        })
                except Exception as e:
                    # 日期格式错误也记录
                    invalid_records.append({
                        "row": idx + 2,
                        "date": str(date_value),
                        "expected": expected_year_month,
                        "error": f"日期格式错误: {str(e)}"
                    })
    
    if invalid_records:
        error_message = f"只能导入上个月({expected_year_month})的数据。发现 {len(invalid_records)} 条不符合要求的记录。"
        return False, error_message, invalid_records
    
    return True, None, []

def get_employee_names(engine):
    """
    查询员工表中所有在职员工的姓名
    """
    try:
        query = text("""
            SELECT DISTINCT name 
            FROM sys_employees 
            WHERE (isResigned IS NULL OR isResigned = 0) 
            AND name IS NOT NULL 
            AND name != ''
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query)
            employee_names = [row[0] for row in result]
            
        debug_print(f"查询到 {len(employee_names)} 个在职员工姓名")
        return set(employee_names)  # 返回set类型便于对比
        
    except Exception as e:
        debug_print(f"查询员工姓名失败: {str(e)}")
        return set()

def compare_employee_names(employee_names, import_names):
    """
    对比员工表姓名和导入文件中的姓名
    返回不匹配的情况
    """
    # 找出导入文件中存在但员工表中不存在的姓名（员工未录入）
    not_in_employee_table = import_names - employee_names
    
    # 找出员工表中存在但导入文件中不存在的姓名（没有考勤信息）
    not_in_import_file = employee_names - import_names
    
    return not_in_employee_table, not_in_import_file

def import_attendance_deduction_data(file_path, overwrite_mode=False):
    try:
        debug_print("开始导入考勤扣款数据函数")
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
            
            # 验证日期范围 - 只允许导入上个月的数据
            if '年月' in df.columns:
                print("开始验证日期范围...")
                is_valid, error_message, invalid_records = validate_date_range(df, '年月')
                if not is_valid:
                    print(f"日期验证失败: {error_message}")
                    error_info = {
                        "success": False,
                        "error": "invalid_date_range",
                        "message": "只能导入上个月数据",
                        "details": error_message,
                        "invalidRecords": invalid_records
                    }
                    print(f"ERROR_INFO_JSON: {json.dumps(error_info, ensure_ascii=False)}")
                    return False
                print("日期验证通过")
            else:
                print("警告: 未找到'年月'列，跳过日期验证")
            
            # 获取导入文件中的所有姓名（去除空值和重复值）
            import_names = set()
            if 'name' in db_data.columns:
                import_names = set(db_data['name'].dropna().astype(str).str.strip())
                import_names = {name for name in import_names if name and name != ''}
            
            debug_print(f"导入文件中包含 {len(import_names)} 个不同的姓名")
            
            # 查询员工表中的所有在职员工姓名
            employee_names = get_employee_names(engine)
            
            # 对比姓名
            not_in_employee_table, not_in_import_file = compare_employee_names(employee_names, import_names)
            
            # 检查是否有姓名不匹配的情况
            name_mismatch_errors = []
            
            if not_in_employee_table:
                for name in not_in_employee_table:
                    name_mismatch_errors.append(f"{name}员工未录入")
            
            if not_in_import_file:
                for name in not_in_import_file:
                    name_mismatch_errors.append(f"{name}没有考勤信息")
            
            # 记录姓名不匹配的情况，但不阻止导入
            name_mismatch_details = {
                "employees_not_recorded": list(not_in_employee_table),
                "employees_no_attendance": list(not_in_import_file)
            }
            
            if name_mismatch_errors:
                error_msg = "姓名对比发现问题: " + "; ".join(name_mismatch_errors)
                print(error_msg)
                
                # 过滤掉未录入的员工，只处理已录入的员工数据
                valid_employee_names = [name for name in import_names if name not in not_in_employee_table]
                
                if not valid_employee_names:
                    # 如果没有任何有效的员工数据，则返回错误
                    error_info = {
                        "success": False,
                        "error_type": "no_valid_data",
                        "error_message": "没有找到任何有效的员工数据可以导入",
                        "failed_records": [],
                        "name_mismatch_details": name_mismatch_details
                    }
                    print(f"ERROR_INFO_JSON: {json.dumps(error_info, ensure_ascii=False)}")
                    return False
                
                print(f"发现 {len(not_in_employee_table)} 个未录入的员工，将跳过: {', '.join(not_in_employee_table)}")
                print(f"将处理 {len(valid_employee_names)} 个有效员工的数据")
                
                # 过滤数据，只保留有效员工的记录
                db_data = db_data[db_data['name'].isin(valid_employee_names)].copy()
                print(f"过滤后的数据包含 {len(db_data)} 行记录")
            else:
                print("姓名对比通过，继续进行数据验证...")
                # 保留姓名对比的详细信息，即使没有错误也要返回给前端
                debug_print(f"姓名对比详情: 员工表中缺失 {len(not_in_import_file)} 个员工的考勤信息")
            
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
                                        DELETE FROM sys_attendance_deduction 
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
                                    INSERT INTO sys_attendance_deduction 
                                    (name, attendanceDeduction, fullAttendanceBonus, yearMonth, remark, createdAt, updatedAt) 
                                    VALUES (:name, :attendanceDeduction, :fullAttendanceBonus, :yearMonth, :remark, NOW(), NOW())
                                """)
                                
                                # 执行插入
                                params = {
                                    'name': row['name'],
                                    'attendanceDeduction': row.get('attendanceDeduction', 0) or 0,
                                    'fullAttendanceBonus': row.get('fullAttendanceBonus', 0) or 0,
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
            
            # 如果有姓名不匹配的情况，添加到结果中
            if name_mismatch_details and (name_mismatch_details['employees_not_recorded'] or name_mismatch_details['employees_no_attendance']):
                result['name_mismatch_details'] = name_mismatch_details
                # 如果有跳过的员工，添加警告信息
                if name_mismatch_details['employees_not_recorded']:
                    if not result['error_message']:
                        result['error_message'] = "部分员工姓名不匹配，已跳过处理"
                    result['warning'] = f"跳过了 {len(name_mismatch_details['employees_not_recorded'])} 个未录入的员工"
            
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
    parser.add_argument('--overwrite', action='store_true', help='是否覆盖现有数据')
    args = parser.parse_args()
    
    # 执行导入
    success = import_attendance_deduction_data(args.file, args.overwrite)
    
    # 返回结果代码
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 