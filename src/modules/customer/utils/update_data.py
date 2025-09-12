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

def update_excel_data(file_path):
    try:
        debug_print("开始批量更新Excel数据函数")
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

        # 检查环境变量
        for key, value in os.environ.items():
            if key.startswith('DB_'):
                debug_print(f"环境变量 {key}={'*****' if 'PASSWORD' in key else value}")

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

        # 读取输入文件
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
                        # 添加参数来处理混合数据类型和性能优化
                        df = pd.read_csv(
                            file_path, 
                            encoding=encoding, 
                            dtype=str,  # 将所有列都读取为字符串类型，避免混合类型警告
                            low_memory=False,  # 解决 low_memory 警告
                            na_values=['', 'NULL', 'null', 'None', 'none', 'NaN', 'nan'],  # 统一空值处理
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
                df = pd.read_excel(file_path, engine='openpyxl')
            
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
            
            # 检查是否包含必要的列（企业名称是必须的）
            required_columns = ['企业名称']
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
            if '顾问会计' in column_names:
                available_update_fields.append('顾问会计')
            if '记账会计' in column_names:
                available_update_fields.append('记账会计')
            
            if not available_update_fields:
                error_msg = "文件中没有可更新的字段（顾问会计、记账会计）"
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
            
            # 根据实体定义创建完整的映射关系
            column_mapping = {
                '企业名称': 'companyName',
                '归属地': 'location',
                '顾问会计': 'consultantAccountant',
                '记账会计': 'bookkeepingAccountant',
                '开票员': 'invoiceOfficer',
                '企业类型': 'enterpriseType',
                '统一社会信用代码': 'unifiedSocialCreditCode',
                '税号': 'taxNumber',
                '注册地址': 'registeredAddress',
                '实际经营地址': 'businessAddress',
                '所属分局': 'taxBureau',
                '实际负责人(备注)': 'actualResponsibleRemark',
                '同宗企业': 'affiliatedEnterprises',
                '老板画像': 'bossProfile',
                '企业画像': 'enterpriseProfile',
                '行业大类': 'industryCategory',
                '行业细分': 'industrySubcategory',
                '是否有税收优惠': 'hasTaxBenefits',
                '工商公示密码': 'businessPublicationPassword',
                '成立日期': 'establishmentDate',
                '营业执照期限': 'licenseExpiryDate',
                '注册资金': 'registeredCapital',
                '认缴到期日期': 'capitalContributionDeadline',
                '认缴到期日期2': 'capitalContributionDeadline2',
                '对公开户行': 'publicBank',
                '开户行账号': 'bankAccountNumber',
                '基本存款账户编号': 'basicDepositAccountNumber',
                '一般户开户行': 'generalAccountBank',
                '一般户账号': 'generalAccountNumber',
                '一般户开户时间': 'generalAccountOpeningDate',
                '对公开户时间': 'publicBankOpeningDate',
                '网银托管档案号': 'onlineBankingArchiveNumber',
                '报税登录方式': 'taxReportLoginMethod',
                '法人姓名': 'legalRepresentativeName',
                '法人电话': 'legalRepresentativePhone',
                '法人电话2': 'legalRepresentativePhone2',
                '法人身份证号': 'legalRepresentativeId',
                '法人税务密码': 'legalRepresentativeTaxPassword',
                '办税员': 'taxOfficerName',
                '办税员电话': 'taxOfficerPhone',
                '办税员身份证号': 'taxOfficerId',
                '办税员税务密码': 'taxOfficerTaxPassword',
                '开票软件': 'invoicingSoftware',
                '开票注意事项': 'invoicingNotes',
                '开票员姓名': 'invoiceOfficerName',
                '开票员电话': 'invoiceOfficerPhone',
                '开票员身份证号': 'invoiceOfficerId',
                '开票员税务密码': 'invoiceOfficerTaxPassword',
                '财务负责人': 'financialContactName',
                '财务负责人电话': 'financialContactPhone',
                '财务负责人身份证号': 'financialContactId',
                '财务负责人税务密码': 'financialContactTaxPassword',
                '税种': 'taxCategories',
                '社保险种': 'socialInsuranceTypes',
                '参保人员': 'insuredPersonnel',
                '三方协议扣款账户': 'tripartiteAgreementAccount',
                '个税密码': 'personalIncomeTaxPassword',
                '个税申报人员': 'personalIncomeTaxStaff',
                '纸质资料档案编号': 'paperArchiveNumber',
                '网银托管存放编号': 'onlineBankingStorageNumber',
                '档案存放备注': 'archiveStorageRemarks',
                '章存放编号': 'sealStorageNumber',
                '企业状态': 'enterpriseStatus',
                '客户分级': 'customerLevel',
                '业务状态': 'businessStatus',
                '备注信息': 'remarks'
            }
            
            # 创建一个新的DataFrame用于更新数据库
            db_data = pd.DataFrame()
            
            # 遍历映射关系，将Excel数据映射到数据库字段
            for excel_col, db_col in column_mapping.items():
                if excel_col in df.columns:
                    # 复制列数据并清理空值
                    column_data = df[excel_col].copy()
                    # 将空字符串和常见的空值表示转换为 None
                    column_data = column_data.replace(['', 'NULL', 'null', 'None', 'none', 'NaN', 'nan'], None)
                    # 去除字符串两端的空白
                    column_data = column_data.apply(lambda x: x.strip() if isinstance(x, str) and x is not None else x)
                    db_data[db_col] = column_data
                    debug_print(f"映射列: {excel_col} -> {db_col}")
                else:
                    debug_print(f"警告: 文件中未找到列 '{excel_col}'")
                    db_data[db_col] = None
            
            # 验证企业名称是否存在
            validation_errors = []
            valid_records = []
            
            # 定义日期字段列表
            date_fields = [
                'establishmentDate', 'licenseExpiryDate', 
                'capitalContributionDeadline', 'capitalContributionDeadline2',
                'generalAccountOpeningDate', 'publicBankOpeningDate'
            ]
            
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
                        'unifiedSocialCreditCode': row.get('unifiedSocialCreditCode', ''),
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
            
            # 处理日期字段 - 只对有效记录进行处理
            if not db_data.empty:
                # 处理日期字段
                for field in date_fields:
                    if field in db_data:
                        # 由于所有数据都是字符串类型，需要更谨慎地处理日期转换
                        try:
                            # 先过滤掉空值和无效值
                            date_series = db_data[field].copy()
                            # 将空字符串和None值设为pd.NaT
                            date_series = date_series.replace(['', 'NULL', 'null', 'None', 'none'], None)
                            # 尝试转换为日期时间
                            db_data[field] = pd.to_datetime(date_series, errors='coerce', dayfirst=False)
                            debug_print(f"成功处理日期字段: {field}")
                        except Exception as e:
                            debug_print(f"警告: 无法将 {field} 转换为日期格式，设置为NULL: {str(e)}")
                            db_data[field] = None
            
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
                            
                            # 只更新CSV文件中实际包含的字段
                            update_fields = {}
                            
                            # 检查顾问会计字段
                            if 'consultantAccountant' in record and record['consultantAccountant'] is not None:
                                consultant = str(record['consultantAccountant']).strip()
                                if consultant:  # 不为空字符串
                                    update_fields['consultantAccountant'] = consultant
                            
                            # 检查记账会计字段  
                            if 'bookkeepingAccountant' in record and record['bookkeepingAccountant'] is not None:
                                bookkeeper = str(record['bookkeepingAccountant']).strip()
                                if bookkeeper:  # 不为空字符串
                                    update_fields['bookkeepingAccountant'] = bookkeeper
                            
                            # 添加更新时间
                            update_fields['updateTime'] = current_time
                            
                            if not update_fields:  # 如果没有需要更新的字段，跳过此记录
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
                                # 逐一处理每条更新记录
                                for record in records_to_update:
                                    # 提取需要的字段（只记录实际更新的字段）
                                    service_history_fields = {
                                        'companyName': record.get('companyName'),
                                        'createdAt': current_time,
                                        'updatedAt': current_time
                                    }
                                    
                                    # 只添加实际更新的字段到服务历程
                                    if record.get('consultantAccountant'):
                                        service_history_fields['consultantAccountant'] = record.get('consultantAccountant')
                                    if record.get('bookkeepingAccountant'):
                                        service_history_fields['bookkeepingAccountant'] = record.get('bookkeepingAccountant')
                                    
                                    # 移除None值
                                    service_history_fields = {k: v for k, v in service_history_fields.items() if v is not None}
                                    
                                    # 检查是否有关键字段发生变化
                                    has_key_field = any(key in service_history_fields for key in [
                                        'consultantAccountant', 'bookkeepingAccountant', 
                                        'invoiceOfficer', 'enterpriseStatus', 'businessStatus'
                                    ])
                                    
                                    # 只有在包含必要字段且有关键字段更新时才创建记录
                                    if ('companyName' in service_history_fields or 'unifiedSocialCreditCode' in service_history_fields) and has_key_field:
                                        # 构建INSERT SQL
                                        fields = ', '.join(service_history_fields.keys())
                                        placeholders = ', '.join([f":{key}" for key in service_history_fields.keys()])
                                        insert_sql = f"INSERT INTO sys_service_history ({fields}) VALUES ({placeholders})"
                                        
                                        # 执行插入
                                        try:
                                            conn.execute(text(insert_sql), service_history_fields)
                                        except Exception as e:
                                            print(f"插入服务历程记录时出错: {str(e)}")
                                
                                # 提交事务
                                conn.commit()
                                
                            print("服务历程记录创建完成")
                        except Exception as sh_error:
                            print(f"创建服务历程记录失败: {str(sh_error)}")
                            # 不影响主流程，继续执行
                    
                except Exception as e:
                    success = False
                    error_message = str(e)
                    print(f"批量更新数据失败: {error_message}")
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
            print(f"UPDATE_RESULT_JSON: {json.dumps(result)}")
            
            return result

        except Exception as e:
            error_msg = f"更新过程中出错: {str(e)}"
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
        parser = argparse.ArgumentParser(description='批量更新客户数据')
        parser.add_argument('--file', type=str, help='Excel或CSV文件路径')
        args = parser.parse_args()
        
        # 获取文件路径
        if args.file:
            file_path = args.file
        else:
            print("错误: 未指定文件路径")
            sys.exit(1)
        
        # 更新数据
        print(f"开始批量更新文件: {file_path}")
        result = update_excel_data(file_path)
        
        # 返回结果状态码
        if result and isinstance(result, dict):
            # 打印更新结果摘要
            if result.get('success'):
                print(f"更新完成: 成功更新 {result.get('updated_count')} 条记录")
                if result.get('failed_count', 0) > 0:
                    print(f"有 {result.get('failed_count')} 条记录更新失败")
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