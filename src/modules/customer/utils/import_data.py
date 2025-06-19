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

def import_excel_data(file_path):
    try:
        debug_print("开始导入Excel数据函数")
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
            db_data['createTime'] = current_time
            db_data['updateTime'] = current_time
            
            # 检查和收集数据验证错误
            validation_errors = []
            valid_records = []
            
            # 定义日期字段列表
            date_fields = [
                'establishmentDate', 'licenseExpiryDate', 
                'capitalContributionDeadline', 'capitalContributionDeadline2',
                'generalAccountOpeningDate', 'publicBankOpeningDate'
            ]
            
            # 字段类型验证规则
            field_validators = {
                'unifiedSocialCreditCode': lambda x: isinstance(x, str) and len(x) > 0,  # 必须是非空字符串
                'companyName': lambda x: isinstance(x, str) and len(x) > 0,  # 必须是非空字符串
                'establishmentDate': lambda x: pd.isna(x) or isinstance(x, (str, pd.Timestamp, datetime)),  # 可以为空或日期
                'licenseExpiryDate': lambda x: pd.isna(x) or isinstance(x, (str, pd.Timestamp, datetime)),  # 可以为空或日期
                'registeredCapital': lambda x: pd.isna(x) or isinstance(x, (int, float, str)),  # 可以为空或数值
                'capitalContributionDeadline': lambda x: pd.isna(x) or isinstance(x, (str, pd.Timestamp, datetime)),  # 可以为空或日期
                'capitalContributionDeadline2': lambda x: pd.isna(x) or isinstance(x, (str, pd.Timestamp, datetime)),  # 可以为空或日期
                'generalAccountOpeningDate': lambda x: pd.isna(x) or isinstance(x, (str, pd.Timestamp, datetime)),  # 可以为空或日期
                'publicBankOpeningDate': lambda x: pd.isna(x) or isinstance(x, (str, pd.Timestamp, datetime))  # 可以为空或日期
            }
            
            # 检查每条记录
            for index, row in db_data.iterrows():
                row_errors = []
                
                # 检查企业名称是否为空（必填字段）
                if pd.isna(row.get('companyName')) or not row.get('companyName'):
                    row_errors.append("企业名称不能为空")
                
                # 格式验证
                for field, validator in field_validators.items():
                    if field in row and not pd.isna(row[field]):
                        try:
                            # 日期字段特殊处理
                            if field in date_fields and isinstance(row[field], str):
                                try:
                                    # 尝试转换为日期，但不保存结果
                                    test_date = pd.to_datetime(row[field])
                                    if pd.isna(test_date):
                                        row_errors.append(f"{field}格式错误：'{row[field]}'不是有效的日期格式")
                                except:
                                    row_errors.append(f"{field}格式错误：'{row[field]}'不是有效的日期格式")
                            # 其他字段正常验证
                            elif not validator(row[field]):
                                row_errors.append(f"{field}格式错误：'{row[field]}'不符合要求")
                        except Exception as e:
                            row_errors.append(f"{field}验证出错：{str(e)}")
                
                # 收集此行的所有错误
                if row_errors:
                    validation_errors.append({
                        'index': index,
                        'row': index + 2,  # Excel行号从1开始，且有标题行
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
                        # 确保日期格式正确
                        if db_data[field].dtype != 'datetime64[ns]':
                            try:
                                db_data[field] = pd.to_datetime(db_data[field], errors='coerce')
                            except:
                                debug_print(f"警告: 无法将 {field} 转换为日期格式，设置为NULL")
            
            # 替换NaN为None(NULL)
            if not db_data.empty:
                db_data = db_data.replace({np.nan: None})
            
            # 查询数据库中已存在的统一社会信用代码
            existing_codes = []
            with engine.connect() as conn:
                result = conn.execute(text("SELECT unifiedSocialCreditCode FROM sys_customer WHERE unifiedSocialCreditCode IS NOT NULL"))
                existing_codes = [row[0] for row in result if row[0]]
            
            debug_print(f"数据库中已存在 {len(existing_codes)} 个统一社会信用代码记录")
            
            # 筛选出重复的记录和非重复的记录
            duplicate_records = []
            non_duplicate_records = []
            
            if not db_data.empty:
                for index, row in db_data.iterrows():
                    code = row.get('unifiedSocialCreditCode')
                    # 只检查非空的统一社会信用代码
                    if code and code in existing_codes:
                        duplicate_records.append({
                            'index': index,
                            'row': index + 2,  # Excel行号从1开始，且有标题行
                            'companyName': row.get('companyName', '未知企业'),
                            'unifiedSocialCreditCode': code,
                            'reason': '统一社会信用代码重复'
                        })
                    else:
                        non_duplicate_records.append(row)
            
            # 转换非重复记录为DataFrame
            filtered_data = pd.DataFrame(non_duplicate_records) if non_duplicate_records else pd.DataFrame()
            
            # 输出重复记录信息
            if duplicate_records:
                debug_print(f"发现 {len(duplicate_records)} 条重复的统一社会信用代码记录:")
                for record in duplicate_records:
                    debug_print(f"  行 {record['row']}: {record['companyName']} - {record['unifiedSocialCreditCode']}")
            
            # 合并所有错误记录
            failed_records = validation_errors + duplicate_records
            
            # 输出准备导入的数据
            print(f"准备导入 {len(filtered_data)} 条非重复记录到数据库")
            print(f"发现 {len(failed_records)} 条无效记录")
            
            # 导入过滤后的数据
            success = True
            error_message = ""
            if filtered_data.empty:
                print("没有可导入的非重复记录")
            else:
                try:
                    # 将数据导入到数据库表名为sys_customer
                    print("开始导入数据到数据库...")
                    filtered_data.to_sql('sys_customer', engine, if_exists='append', index=False)
                    print("数据导入成功!")
                    
                    # 为新导入的客户创建服务历程记录
                    print("开始创建服务历程记录...")
                    
                    # 提取服务历程需要的字段
                    service_history_fields = [
                        'companyName', 'unifiedSocialCreditCode', 
                        'consultantAccountant', 'bookkeepingAccountant', 
                        'invoiceOfficer', 'enterpriseStatus', 'businessStatus'
                    ]
                    
                    # 创建服务历程数据
                    service_history_data = filtered_data[
                        [col for col in service_history_fields if col in filtered_data.columns]
                    ].copy()
                    
                    # 添加创建和更新时间
                    service_history_data['createdAt'] = current_time
                    service_history_data['updatedAt'] = current_time
                    
                    # 导入服务历程记录
                    try:
                        service_history_data.to_sql('sys_service_history', engine, if_exists='append', index=False)
                        print(f"成功创建 {len(service_history_data)} 条服务历程记录!")
                    except Exception as sh_error:
                        print(f"创建服务历程记录失败: {str(sh_error)}")
                        # 不影响主流程，继续执行
                except Exception as e:
                    success = False
                    error_message = str(e)
                    print(f"导入数据到数据库失败: {error_message}")
                    traceback.print_exc()
            
            # 准备结果对象
            result = {
                'success': success and len(filtered_data) > 0,
                'imported_count': len(filtered_data) if success else 0,
                'failed_count': len(failed_records),
                'failed_records': failed_records,
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

def main():
    try:
        # 创建命令行参数解析器
        parser = argparse.ArgumentParser(description='导入客户Excel数据到数据库')
        parser.add_argument('--file', type=str, help='Excel文件路径')
        args = parser.parse_args()
        
        # 获取文件路径
        if args.file:
            file_path = args.file
        else:
            print("错误: 未指定Excel文件路径")
            sys.exit(1)
        
        # 导入数据
        print(f"开始导入文件: {file_path}")
        result = import_excel_data(file_path)
        
        # 返回结果状态码
        if result and isinstance(result, dict):
            # 打印导入结果摘要
            if result.get('success'):
                print(f"导入完成: 成功导入 {result.get('imported_count')} 条记录")
                if result.get('failed_count', 0) > 0:
                    print(f"有 {result.get('failed_count')} 条记录导入失败")
                sys.exit(0)
            else:
                # 检查是否所有记录都是因为重复导致的失败
                failed_records = result.get('failed_records', [])
                all_duplicates = all(record.get('reason') == '统一社会信用代码重复' 
                                    for record in failed_records) if failed_records else False
                
                if all_duplicates and failed_records:
                    # 如果所有失败都是因为重复，我们将以成功状态退出
                    print(f"所有记录({len(failed_records)}条)均为重复数据，无需导入")
                    sys.exit(0)
                else:
                    # 其他失败情况
                    sys.exit(1)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"主函数异常: {str(e)}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
