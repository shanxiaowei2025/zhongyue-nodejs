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
from dotenv import load_dotenv # type: ignore

# 设置调试模式
DEBUG = True

def debug_print(message):
    """打印调试信息"""
    if DEBUG:
        print(f"DEBUG: {message}")

def update_status_data(file_path):
    try:
        debug_print("开始更新企业状态和业务状态数据函数")
        debug_print(f"Python版本: {sys.version}")
        debug_print(f"当前工作目录: {os.getcwd()}")
        debug_print(f"命令行参数: {sys.argv}")
        
        # 加载环境变量
        # 尝试从多个位置加载 .env 文件
        env_paths = ['.env', 'src/.env', '../.env']
        env_loaded = False
        
        for env_path in env_paths:
            if os.path.exists(env_path):
                load_dotenv(env_path)
                debug_print(f"成功加载环境变量文件: {env_path}")
                env_loaded = True
                break
        
        if not env_loaded:
            debug_print("未找到 .env 文件，使用系统环境变量和默认值")
        
        # 配置数据库连接
        # 从环境变量获取数据库连接信息，使用项目的默认配置
        # 如果在Docker外部运行脚本，使用localhost；如果在Docker内部，使用host.docker.internal
        db_host_env = os.environ.get('DB_HOST', 'host.docker.internal')
        if db_host_env == 'host.docker.internal':
            # 检测是否在Docker外部运行，如果是则使用localhost
            DB_HOST = 'localhost'
        else:
            DB_HOST = db_host_env
            
        DB_PORT = os.environ.get('DB_PORT', '3306')
        DB_NAME = os.environ.get('DB_DATABASE', 'zhongyue_nodejs')
        DB_USER = os.environ.get('DB_USERNAME', 'root')
        # 对密码进行 URL 编码，防止特殊字符（如 @）导致连接失败
        DB_PASS = urllib.parse.quote_plus(os.environ.get('DB_PASSWORD', 'zhongyue123'))

        # 输出数据库连接信息（不包含密码）
        debug_print(f"数据库连接信息: Host={DB_HOST}, Port={DB_PORT}, Name={DB_NAME}, User={DB_USER}")

        # 检查环境变量
        for key, value in os.environ.items():
            if key.startswith('DB_'):
                debug_print(f"环境变量 {key}={'*****' if 'PASSWORD' in key else value}")

        # 验证数据库配置
        if not DB_NAME or not DB_USER:
            error_msg = "错误: 缺少数据库连接信息，请检查环境变量配置或创建 .env 文件"
            print(error_msg)
            print("提示: 请确保设置了以下环境变量:")
            print("  DB_HOST (默认: host.docker.internal)")
            print("  DB_PORT (默认: 3306)")
            print("  DB_DATABASE (默认: zhongyue_nodejs)")
            print("  DB_USERNAME (默认: root)")
            print("  DB_PASSWORD (默认: zhongyue123)")
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
                # 读取CSV文件，尝试多种编码方式
                print(f"检测到CSV文件，尝试读取")
                
                # 定义可能的编码列表，按可能性顺序排列
                encodings_to_try = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'big5', 'latin-1']
                
                # 尝试不同的编码读取文件
                df = None
                last_error = None
                
                for encoding in encodings_to_try:
                    try:
                        print(f"尝试使用 {encoding} 编码读取CSV文件")
                        df = pd.read_csv(
                            file_path, 
                            encoding=encoding, 
                            dtype=str,  # 将所有列都读取为字符串类型
                            low_memory=False,
                            na_values=['', 'NULL', 'null', 'None', 'none', 'NaN', 'nan'],
                            keep_default_na=True
                        )
                        if df is not None and len(df.columns) > 0:
                            print(f"成功使用 {encoding} 编码读取CSV文件")
                            break
                    except Exception as e:
                        last_error = str(e)
                        print(f"使用 {encoding} 编码读取失败: {str(e)}")
                        continue
                
                # 如果所有编码都失败了，抛出异常
                if df is None or len(df.columns) == 0:
                    error_msg = f"无法读取CSV文件，尝试了以下编码: {', '.join(encodings_to_try)}，最后错误: {last_error}"
                    print(error_msg)
                    error_info = {
                        "success": False,
                        "error_type": "file_reading_error",
                        "error_message": error_msg,
                        "failed_records": []
                    }
                    print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                    return False
            else:
                # 读取Excel文件
                print(f"检测到Excel文件，使用pandas.read_excel读取")
                try:
                    df = pd.read_excel(file_path, engine='openpyxl')
                except Exception as e:
                    error_msg = f"Excel文件读取失败: {str(e)}"
                    print(error_msg)
                    error_info = {
                        "success": False,
                        "error_type": "excel_read_error",
                        "error_message": error_msg,
                        "failed_records": []
                    }
                    print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                    raise Exception(f"Excel文件读取失败: {str(e)}")
            
            print(f"成功读取文件，包含 {len(df)} 行数据，{len(df.columns)} 列")
            
            # 检查是否有数据
            if len(df) == 0:
                error_msg = "文件中没有数据行"
                print(error_msg)
                error_info = {
                    "success": False,
                    "error_type": "empty_file",
                    "error_message": error_msg,
                    "failed_records": []
                }
                print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                return False
            
            # 显示前几行数据以检查
            print("数据预览:")
            print(df.head())
            
            # 获取列名
            column_names = df.columns.tolist()
            debug_print(f"文件列名 ({len(column_names)} 列): " + ", ".join(column_names))
            
            # 检查是否包含必要的列
            required_columns = ['companyName']
            missing_columns = [col for col in required_columns if col not in column_names]
            if missing_columns:
                error_msg = f"文件缺少必要的列: {', '.join(missing_columns)}"
                print(error_msg)
                error_info = {
                    "success": False,
                    "error_type": "missing_columns",
                    "error_message": error_msg,
                    "failed_records": []
                }
                print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                return False
            
            # 检查可用的更新字段
            available_update_fields = []
            if 'enterpriseStatus' in column_names:
                available_update_fields.append('enterpriseStatus')
            if 'businessStatus' in column_names:
                available_update_fields.append('businessStatus')
            
            if not available_update_fields:
                error_msg = "文件中没有可更新的状态字段（enterpriseStatus、businessStatus）"
                print(error_msg)
                error_info = {
                    "success": False,
                    "error_type": "no_update_fields",
                    "error_message": error_msg,
                    "failed_records": []
                }
                print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
                return False
                
            print(f"发现可更新字段: {', '.join(available_update_fields)}")
            
            # 创建一个新的DataFrame用于更新数据库
            db_data = pd.DataFrame()
            
            # 映射需要的字段
            field_mapping = {
                'companyName': 'companyName',
                'enterpriseStatus': 'enterpriseStatus',
                'businessStatus': 'businessStatus'
            }
            
            # 遍历映射关系，将文件数据映射到数据库字段
            for file_col, db_col in field_mapping.items():
                if file_col in df.columns:
                    # 复制列数据并清理空值
                    column_data = df[file_col].copy()
                    # 将空字符串和常见的空值表示转换为 None
                    column_data = column_data.replace(['', 'NULL', 'null', 'None', 'none', 'NaN', 'nan'], None)
                    # 去除字符串两端的空白
                    column_data = column_data.apply(lambda x: x.strip() if isinstance(x, str) and x is not None else x)
                    db_data[db_col] = column_data
                    debug_print(f"映射列: {file_col} -> {db_col}")
                else:
                    debug_print(f"警告: 文件中未找到列 '{file_col}'")
                    db_data[db_col] = None
            
            # 验证数据
            validation_errors = []
            valid_records = []
            
            # 检查每条记录
            for index, row in db_data.iterrows():
                row_errors = []
                
                # 检查企业名称是否为空（更新必须有此字段）
                company_name = row.get('companyName')
                if pd.isna(company_name) or not company_name or str(company_name).strip() == '':
                    row_errors.append("企业名称不能为空")
                else:
                    # 清理企业名称
                    company_name = str(company_name).strip()
                
                # 收集此行的所有错误
                if row_errors:
                    validation_errors.append({
                        'index': index,
                        'row': index + 2,  # 文件行号从1开始，且有标题行
                        'companyName': row.get('companyName', '未知企业'),
                        'errors': row_errors,
                        'reason': '数据验证失败: ' + '; '.join(row_errors)
                    })
                else:
                    # 只添加没有错误的记录
                    valid_records.append(row)
            
            # 将有效记录转换为DataFrame
            if valid_records:
                db_data = pd.DataFrame(valid_records)
            else:
                db_data = pd.DataFrame()
            
            # 替换NaN为None(NULL)
            if not db_data.empty:
                db_data = db_data.replace({np.nan: None})
            
            # 查询数据库中存在的企业名称
            existing_companies_map = {}
            not_found_records = []
            
            if not db_data.empty:
                # 获取所有企业名称
                names_to_check = [
                    name for name in db_data['companyName'].tolist() 
                    if name is not None and str(name).strip() != ''
                ]
                
                # 检查这些企业名称是否存在于数据库中
                if names_to_check:
                    # 使用参数化查询防止SQL注入
                    placeholders = ', '.join([f':name_{i}' for i in range(len(names_to_check))])
                    query = f"SELECT id, companyName FROM sys_customer WHERE companyName IN ({placeholders})"
                    
                    # 构建参数字典
                    params = {f'name_{i}': name for i, name in enumerate(names_to_check)}
                    
                    with engine.connect() as conn:
                        result = conn.execute(text(query), params)
                        for row in result:
                            existing_companies_map[row[1]] = row[0]  # 存储企业名称和对应的ID
            
            debug_print(f"数据库中找到 {len(existing_companies_map)} 个匹配的企业名称记录")
            
            # 筛选出存在和不存在的记录
            records_to_update = []
            
            if not db_data.empty:
                for index, row in db_data.iterrows():
                    company_name = row.get('companyName')
                    if company_name and str(company_name).strip() != '':
                        company_name = str(company_name).strip()
                        # 检查企业名称是否存在于数据库中
                        if company_name in existing_companies_map:
                            # 添加数据库记录ID到行数据中
                            row_dict = row.to_dict()
                            row_dict['id'] = existing_companies_map[company_name]
                            records_to_update.append(row_dict)
                        else:
                            not_found_records.append({
                                'index': index,
                                'row': index + 2,  # 文件行号从1开始，且有标题行
                                'companyName': company_name,
                                'reason': '企业名称在数据库中不存在'
                            })
                    else:
                        not_found_records.append({
                            'index': index,
                            'row': index + 2,
                            'companyName': '企业名称为空',
                            'reason': '企业名称不能为空'
                        })
            
            # 输出待更新和未找到的记录信息
            print(f"找到 {len(records_to_update)} 条可更新记录")
            print(f"有 {len(not_found_records)} 条记录在数据库中未找到")
            
            # 所有错误记录
            failed_records = validation_errors + not_found_records
            
            # 更新数据库
            success = True
            error_message = ""
            updated_count = 0
            
            if not records_to_update:
                print("没有可更新的记录")
            else:
                try:
                    # 添加更新时间
                    current_time = datetime.now()
                    
                    # 逐条更新记录
                    with engine.connect() as conn:
                        for record in records_to_update:
                            record_id = record.pop('id')  # 提取ID并从字典中移除
                            
                            # 只更新文件中实际包含的字段
                            update_fields = {}
                            
                            # 检查企业状态字段
                            if 'enterpriseStatus' in record and record['enterpriseStatus'] is not None:
                                enterprise_status = str(record['enterpriseStatus']).strip()
                                if enterprise_status:  # 不为空字符串
                                    update_fields['enterpriseStatus'] = enterprise_status
                            
                            # 检查业务状态字段  
                            if 'businessStatus' in record and record['businessStatus'] is not None:
                                business_status = str(record['businessStatus']).strip()
                                if business_status:  # 不为空字符串
                                    update_fields['businessStatus'] = business_status
                            
                            # 添加更新时间
                            update_fields['updateTime'] = current_time
                            
                            if not update_fields or len(update_fields) == 1:  # 如果没有需要更新的字段（除了updateTime），跳过此记录
                                continue
                                
                            # 构建SET子句
                            set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
                            
                            # 构建更新SQL
                            update_sql = f"UPDATE sys_customer SET {set_clause} WHERE id = :id"
                            
                            # 添加ID到参数中
                            params = {**update_fields, 'id': record_id}
                            
                            # 执行更新
                            try:
                                conn.execute(text(update_sql), params)
                                updated_count += 1
                                debug_print(f"成功更新记录ID={record_id}, 企业名称={record.get('companyName', '')}")
                            except Exception as e:
                                print(f"更新记录ID={record_id}时出错: {str(e)}")
                                failed_records.append({
                                    'id': record_id,
                                    'companyName': record.get('companyName', ''),
                                    'reason': f"更新失败: {str(e)}"
                                })
                        
                        # 提交事务
                        conn.commit()
                    
                    print(f"成功更新 {updated_count} 条记录!")
                    
                    # 为更新的客户创建服务历程记录
                    if updated_count > 0:
                        print("开始创建服务历程记录...")
                        
                        try:
                            with engine.connect() as conn:
                                service_history_count = 0
                                # 逐一处理每条更新记录
                                for record in records_to_update:
                                    # 提取需要的字段（只记录实际更新的字段）
                                    service_history_fields = {
                                        'companyName': record.get('companyName'),
                                        'unifiedSocialCreditCode': '',  # 设置默认空值
                                        'createdAt': current_time,
                                        'updatedAt': current_time
                                    }
                                    
                                    # 只添加实际更新的字段到服务历程
                                    if record.get('enterpriseStatus'):
                                        service_history_fields['enterpriseStatus'] = record.get('enterpriseStatus')
                                    if record.get('businessStatus'):
                                        service_history_fields['businessStatus'] = record.get('businessStatus')
                                    
                                    # 移除None值
                                    service_history_fields = {k: v for k, v in service_history_fields.items() if v is not None}
                                    
                                    # 检查是否有关键字段发生变化
                                    has_key_field = any(key in service_history_fields for key in [
                                        'enterpriseStatus', 'businessStatus'
                                    ])
                                    
                                    # 只有在包含必要字段且有关键字段更新时才创建记录
                                    if 'companyName' in service_history_fields and has_key_field:
                                        # 构建INSERT SQL
                                        fields = ', '.join(service_history_fields.keys())
                                        placeholders = ', '.join([f":{key}" for key in service_history_fields.keys()])
                                        insert_sql = f"INSERT INTO sys_service_history ({fields}) VALUES ({placeholders})"
                                        
                                        # 执行插入
                                        try:
                                            conn.execute(text(insert_sql), service_history_fields)
                                            service_history_count += 1
                                            debug_print(f"成功创建服务历程记录: {record.get('companyName', '')}")
                                        except Exception as e:
                                            print(f"插入服务历程记录时出错: {str(e)}")
                                
                                # 提交事务
                                conn.commit()
                                
                            print(f"成功创建 {service_history_count} 条服务历程记录")
                        except Exception as sh_error:
                            print(f"创建服务历程记录失败: {str(sh_error)}")
                            print("错误堆栈跟踪:")
                            traceback.print_exc()
                            # 不影响主流程，继续执行
                    
                except Exception as e:
                    success = False
                    error_message = str(e)
                    print(f"批量更新状态数据失败: {error_message}")
                    print("错误堆栈跟踪:")
                    traceback.print_exc()
            
            # 准备结果对象
            result = {
                'success': success and updated_count > 0,
                'updated_count': updated_count,
                'failed_count': len(failed_records),
                'failed_records': failed_records,
                'error_message': error_message
            }
            
            # 输出JSON格式结果，便于Node.js解析
            print(f"UPDATE_STATUS_RESULT_JSON: {json.dumps(result)}")
            
            return result

        except Exception as e:
            error_msg = f"更新状态过程中出错: {str(e)}"
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
        parser = argparse.ArgumentParser(description='批量更新客户企业状态和业务状态')
        parser.add_argument('--file', type=str, help='Excel或CSV文件路径')
        args = parser.parse_args()
        
        # 获取文件路径
        if args.file:
            file_path = args.file
        else:
            error_msg = "错误: 未指定文件路径"
            print(error_msg)
            print("使用方法: python update_status_data.py --file /path/to/your/file.xlsx")
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
        
        # 更新状态数据
        print(f"开始更新客户状态文件: {file_path}")
        result = update_status_data(file_path)
        
        # 返回结果状态码
        if result and isinstance(result, dict):
            # 打印更新结果摘要
            if result.get('success'):
                print(f"状态更新完成: 成功更新 {result.get('updated_count')} 条记录")
                if result.get('failed_count', 0) > 0:
                    print(f"有 {result.get('failed_count')} 条记录更新失败")
                    # 显示失败记录的详细信息
                    failed_records = result.get('failed_records', [])
                    for i, record in enumerate(failed_records[:5]):  # 只显示前5条
                        print(f"  失败记录 {i+1}: 行 {record.get('row', '?')}: {record.get('companyName', '未知')} - {record.get('reason', '未知原因')}")
                    if len(failed_records) > 5:
                        print(f"  ... 以及其他 {len(failed_records) - 5} 条失败记录")
                sys.exit(0)
            else:
                print(f"状态更新失败: {result.get('error_message', '未知错误')}")
                if result.get('failed_count', 0) > 0:
                    print(f"失败记录数: {result.get('failed_count')}")
                    failed_records = result.get('failed_records', [])
                    for i, record in enumerate(failed_records[:10]):  # 只显示前10条
                        print(f"  失败记录 {i+1}: 行 {record.get('row', '?')}: {record.get('companyName', '未知')} - {record.get('reason', '未知原因')}")
                    if len(failed_records) > 10:
                        print(f"  ... 以及其他 {len(failed_records) - 10} 条失败记录")
                
                # 输出详细错误信息JSON
                detailed_error = {
                    "success": False,
                    "error_type": "update_failed",
                    "error_message": result.get('error_message', '状态更新失败'),
                    "failed_records": result.get('failed_records', [])
                }
                print(f"ERROR_DETAILS_JSON: {json.dumps(detailed_error)}")
                sys.exit(1)
        else:
            error_msg = "状态更新失败: 未返回有效结果"
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