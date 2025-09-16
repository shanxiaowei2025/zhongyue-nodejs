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

# 尝试加载dotenv模块来读取.env文件
try:
    from dotenv import load_dotenv
    # 尝试加载多个可能的环境文件
    env_files = ['.env']
    loaded = False
    for env_file in env_files:
        if os.path.exists(env_file):
            load_dotenv(env_file)
            print(f"成功加载环境文件: {env_file}")
            loaded = True
            break
    if not loaded:
        print("未找到环境文件，使用默认配置")
except ImportError:
    print("注意: python-dotenv未安装，将使用默认配置和系统环境变量")
except Exception as e:
    print(f"加载环境文件时出错: {e}，将使用默认配置")

# 设置调试模式
DEBUG = True

def debug_print(message):
    """打印调试信息"""
    if DEBUG:
        print(f"DEBUG: {message}")

def update_expense_data(file_path):
    """
    根据Excel文件中的数据更新sys_expense表
    通过企业名称(companyName)和创建时间(createdAt)匹配记录
    """
    try:
        debug_print("开始更新费用数据函数")
        debug_print(f"Python版本: {sys.version}")
        debug_print(f"当前工作目录: {os.getcwd()}")
        debug_print(f"命令行参数: {sys.argv}")
        
        # 配置数据库连接
        # 从环境变量获取数据库连接信息，使用与NestJS相同的默认值
        DB_HOST = 'localhost'
        DB_PORT = os.environ.get('DB_PORT', '3306')
        DB_NAME = os.environ.get('DB_DATABASE', 'zhongyue')
        DB_USER = os.environ.get('DB_USERNAME', 'root')
        # 对密码进行 URL 编码，防止特殊字符（如 @）导致连接失败
        DB_PASS = urllib.parse.quote_plus(os.environ.get('DB_PASSWORD', 'root'))

        # 输出数据库连接信息（不包含密码）
        debug_print(f"数据库连接信息: Host={DB_HOST}, Port={DB_PORT}, Name={DB_NAME}, User={DB_USER}")
        print(f"使用数据库配置: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

        # 检查环境变量
        for key, value in os.environ.items():
            if key.startswith('DB_'):
                debug_print(f"环境变量 {key}={'*****' if 'PASSWORD' in key else value}")

        # 验证数据库配置（现在有了默认值，应该不会为空）
        if not DB_NAME or not DB_USER:
            error_msg = "错误: 数据库配置无效"
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
                try:
                    df = pd.read_csv(file_path, encoding='utf-8')
                    # 尝试不同的编码方式（如果UTF-8失败）
                    if df.empty or len(df.columns) == 0:
                        print("UTF-8编码读取失败，尝试使用GBK编码读取CSV文件")
                        df = pd.read_csv(file_path, encoding='gbk')
                except Exception as e:
                    error_msg = f"CSV文件读取失败: {str(e)}"
                    print(error_msg)
                    error_info = {
                        "success": False,
                        "error_type": "csv_read_error",
                        "error_message": error_msg,
                        "failed_records": []
                    }
                    print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                    raise Exception(f"CSV文件读取失败: {str(e)}")
            else:
                # 读取Excel文件
                print(f"检测到Excel文件，使用pandas.read_excel读取")
                try:
                    # 首先获取工作表名称
                    excel_file = pd.ExcelFile(file_path)
                    sheet_names = excel_file.sheet_names
                    print(f"Excel工作表: {sheet_names}")
                    
                    # 使用第一个工作表
                    sheet_name = sheet_names[0]
                    print(f"使用工作表: {sheet_name}")
                    
                    df = pd.read_excel(file_path, sheet_name=sheet_name, engine='openpyxl')
                except Exception as e:
                    error_msg = f"Excel文件读取失败: {str(e)}"
                    print(error_msg)
                    # 检查openpyxl版本
                    try:
                        import openpyxl
                        print(f"openpyxl版本: {openpyxl.__version__}")
                    except ImportError:
                        print("openpyxl未安装或无法导入")
                    
                    error_info = {
                        "success": False,
                        "error_type": "excel_read_error",
                        "error_message": error_msg,
                        "failed_records": []
                    }
                    print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                    raise Exception(f"Excel文件读取失败: {str(e)}")
            
            print(f"成功读取文件，包含 {len(df)} 行数据")
            
            # 显示前几行数据以检查
            print("数据预览:")
            print(df.head())
            
            # 获取列名
            debug_print("Excel列名: " + ", ".join(df.columns.tolist()))
            
            # 定义字段映射关系（Excel列名 -> 数据库字段名）
            column_mapping = {
                '企业名称': 'companyName',
                '创建时间': 'createdAt',
                '其他业务收费（基础）': 'otherBusinessFee',
                '其他业务（基础）': 'otherBusiness',
                '其他业务收费': 'otherBusinessOutsourcingFee',
                '其他业务': 'otherBusinessOutsourcing',
                '其他业务收费（特殊）': 'otherBusinessSpecialFee',
                '其他业务（特殊）': 'otherBusinessSpecial'
            }
            
            # 检查必要列是否存在
            required_columns = ['企业名称', '创建时间']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                error_msg = f"缺少必要列: {', '.join(missing_columns)}"
                print(error_msg)
                error_info = {
                    "success": False,
                    "error_type": "missing_columns",
                    "error_message": error_msg,
                    "failed_records": []
                }
                print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                return False
            
            # 处理数据
            successful_updates = 0
            failed_updates = []
            
            print(f"开始处理 {len(df)} 条记录...")
            
            for index, row in df.iterrows():
                try:
                    # 获取匹配条件
                    company_name = row.get('企业名称')
                    created_at = row.get('创建时间')
                    
                    # 检查必要字段
                    if pd.isna(company_name) or not company_name:
                        failed_updates.append({
                            'index': index,
                            'row': index + 2,
                            'company_name': company_name,
                            'reason': '企业名称为空'
                        })
                        continue
                    
                    if pd.isna(created_at) or not created_at:
                        failed_updates.append({
                            'index': index,
                            'row': index + 2,
                            'company_name': company_name,
                            'reason': '创建时间为空'
                        })
                        continue
                    
                    # 处理日期格式
                    if isinstance(created_at, str):
                        try:
                            created_at = pd.to_datetime(created_at).strftime('%Y-%m-%d %H:%M:%S')
                        except:
                            created_at_date = pd.to_datetime(created_at).date()
                            created_at = f"{created_at_date} 00:00:00"
                    elif isinstance(created_at, pd.Timestamp):
                        created_at = created_at.strftime('%Y-%m-%d %H:%M:%S')
                    elif isinstance(created_at, datetime):
                        created_at = created_at.strftime('%Y-%m-%d %H:%M:%S')
                    
                    debug_print(f"处理记录 {index + 1}: 企业={company_name}, 创建时间={created_at}")
                    
                    # 构建更新字段和值
                    update_fields = []
                    update_values = {}
                    
                    # 检查每个要更新的字段 - 现在会更新所有字段，包括空值
                    for excel_col, db_col in column_mapping.items():
                        if excel_col in ['企业名称', '创建时间']:
                            continue  # 跳过匹配条件字段
                        
                        if excel_col in df.columns:
                            value = row.get(excel_col)
                            update_fields.append(f"{db_col} = :{db_col}")
                            
                            # 对于 JSON 数组类型的字段，需要将字符串转换为 JSON 数组
                            if db_col in ['otherBusiness', 'otherBusinessOutsourcing', 'otherBusinessSpecial']:
                                if pd.isna(value) or value is None or str(value).strip() == '':
                                    # 空值时设置为空数组
                                    array_value = []
                                    update_values[db_col] = json.dumps(array_value, ensure_ascii=False)
                                    debug_print(f"  更新字段: {db_col} = [] (空数组)")
                                else:
                                    # 如果值包含逗号，按逗号分割为数组，否则作为单个元素的数组
                                    if ',' in str(value):
                                        array_value = [item.strip() for item in str(value).split(',') if item.strip()]
                                    else:
                                        array_value = [str(value).strip()]
                                    update_values[db_col] = json.dumps(array_value, ensure_ascii=False)
                                    debug_print(f"  更新字段: {db_col} = {array_value} (JSON)")
                            else:
                                # 对于费用字段，空值时设置为NULL
                                if pd.isna(value) or value is None or str(value).strip() == '':
                                    update_values[db_col] = None
                                    debug_print(f"  更新字段: {db_col} = NULL")
                                else:
                                    update_values[db_col] = value
                                    debug_print(f"  更新字段: {db_col} = {value}")
                    
                    # 如果没有要更新的字段，跳过
                    if not update_fields:
                        debug_print(f"  跳过记录 {index + 1}: 没有要更新的费用字段")
                        continue
                    
                    # 添加更新时间
                    update_fields.append("updatedAt = :updatedAt")
                    update_values['updatedAt'] = datetime.now()
                    
                    # 构建SQL查询
                    sql_query = f"""
                        UPDATE sys_expense 
                        SET {', '.join(update_fields)}
                        WHERE companyName = :companyName 
                        AND DATE(createdAt) = DATE(:createdAt)
                    """
                    
                    # 添加WHERE条件的参数
                    update_values['companyName'] = company_name
                    update_values['createdAt'] = created_at
                    
                    debug_print(f"  执行SQL: {sql_query}")
                    debug_print(f"  参数: {update_values}")
                    
                    # 执行更新
                    with engine.connect() as conn:
                        result = conn.execute(text(sql_query), update_values)
                        conn.commit()
                        
                        affected_rows = result.rowcount
                        debug_print(f"  影响行数: {affected_rows}")
                        
                        if affected_rows > 0:
                            successful_updates += 1
                            print(f"成功更新记录 {index + 1}: {company_name} ({affected_rows} 行)")
                        else:
                            failed_updates.append({
                                'index': index,
                                'row': index + 2,
                                'company_name': company_name,
                                'reason': '未找到匹配的费用记录'
                            })
                            print(f"警告: 记录 {index + 1} 未找到匹配的费用记录: {company_name}")
                
                except Exception as e:
                    error_msg = f"更新记录 {index + 1} 失败: {str(e)}"
                    print(error_msg)
                    failed_updates.append({
                        'index': index,
                        'row': index + 2,
                        'company_name': company_name if 'company_name' in locals() else '未知',
                        'reason': error_msg
                    })
                    debug_print(f"错误详情: {traceback.format_exc()}")
            
            # 输出结果统计
            print(f"\n更新完成!")
            print(f"成功更新: {successful_updates} 条记录")
            print(f"失败记录: {len(failed_updates)} 条")
            
            if failed_updates:
                print("\n失败记录详情:")
                for i, record in enumerate(failed_updates[:10]):  # 只显示前10条
                    print(f"  {i+1}. 行 {record.get('row', '?')}: {record.get('company_name', '未知')} - {record.get('reason', '未知原因')}")
                if len(failed_updates) > 10:
                    print(f"  ... 以及其他 {len(failed_updates) - 10} 条失败记录")
            
            # 准备结果对象
            result = {
                'success': True,
                'updated_count': successful_updates,
                'failed_count': len(failed_updates),
                'failed_records': failed_updates,
                'error_message': ""
            }
            
            # 输出JSON格式结果，便于Node.js解析
            print(f"UPDATE_RESULT_JSON: {json.dumps(result)}")
            
            return result

        except Exception as e:
            error_msg = f"处理过程中出错: {str(e)}"
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

def main():
    try:
        # 创建命令行参数解析器
        parser = argparse.ArgumentParser(description='根据Excel数据更新费用表中的费用信息')
        parser.add_argument('--file', type=str, help='Excel文件路径')
        args = parser.parse_args()
        
        # 获取文件路径
        if args.file:
            file_path = args.file
        else:
            error_msg = "错误: 未指定Excel文件路径"
            print(error_msg)
            print("命令行参数:", sys.argv)
            error_info = {
                "success": False,
                "error_type": "missing_argument",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            sys.exit(1)
            
        # 检查文件是否存在
        if not os.path.exists(file_path):
            error_msg = f"错误: 文件不存在: {file_path}"
            print(error_msg)
            print("当前工作目录:", os.getcwd())
            error_info = {
                "success": False,
                "error_type": "file_not_found",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            sys.exit(1)
            
        # 检查文件大小
        try:
            file_size = os.path.getsize(file_path)
            print(f"文件大小: {file_size} 字节")
            if file_size == 0:
                error_msg = f"错误: 文件为空: {file_path}"
                print(error_msg)
                error_info = {
                    "success": False,
                    "error_type": "empty_file",
                    "error_message": error_msg,
                    "failed_records": []
                }
                print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                sys.exit(1)
        except Exception as e:
            error_msg = f"错误: 检查文件大小失败: {str(e)}"
            print(error_msg)
            error_info = {
                "success": False,
                "error_type": "file_access_error",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            sys.exit(1)
        
        # 更新数据
        print(f"开始更新费用数据，文件: {file_path}")
        result = update_expense_data(file_path)
        
        # 返回结果状态码
        if result and isinstance(result, dict):
            # 打印更新结果摘要
            if result.get('success'):
                print(f"更新完成: 成功更新 {result.get('updated_count')} 条记录")
                if result.get('failed_count', 0) > 0:
                    print(f"有 {result.get('failed_count')} 条记录更新失败")
                sys.exit(0)
            else:
                # 详细打印失败原因
                print(f"更新失败: {result.get('error_message', '未知错误')}")
                if 'failed_records' in result and result['failed_records']:
                    print(f"失败记录详情:")
                    for i, record in enumerate(result['failed_records'][:10]):  # 只显示前10条
                        print(f"  {i+1}. 行 {record.get('row', '?')}: {record.get('company_name', '未知')} - {record.get('reason', '未知原因')}")
                    if len(result['failed_records']) > 10:
                        print(f"  ... 以及其他 {len(result['failed_records']) - 10} 条错误记录")
                
                # 输出详细错误信息JSON
                detailed_error = {
                    "success": False,
                    "error_type": "update_failed",
                    "error_message": result.get('error_message', '更新失败'),
                    "failed_records": result.get('failed_records', [])
                }
                print(f"ERROR_DETAILS_JSON: {json.dumps(detailed_error)}")
                sys.exit(1)
        else:
            error_msg = "更新失败: 未返回有效结果"
            print(error_msg)
            error_info = {
                "success": False,
                "error_type": "invalid_result",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            sys.exit(1)
    except Exception as e:
        error_msg = f"主函数异常: {str(e)}"
        print(error_msg)
        print("错误类型:", type(e).__name__)
        print("错误详情:")
        traceback.print_exc()
        
        # 输出详细错误信息JSON
        error_info = {
            "success": False,
            "error_type": "fatal_error",
            "error_message": error_msg,
            "stack_trace": traceback.format_exc(),
            "failed_records": []
        }
        print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 