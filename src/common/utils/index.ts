export * from './date.utils';
import { InvalidIdParameterError } from '../filters/http-exception.filter';

/**
 * 安全处理可能导致NaN的日期参数
 * @param value 待处理的日期值
 * @returns 处理后的安全值，如果是无效日期则返回undefined
 */
export function safeDateParam(value: any): Date | string | undefined {
  if (!value) return undefined;

  // 如果是字符串日期格式，先验证格式
  if (typeof value === 'string') {
    // 验证是否符合YYYY-MM-DD格式
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value; // 返回原始字符串，避免自动转换为Date时可能出现的时区问题
    }

    // 尝试转换为Date对象
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : undefined;
  }

  // 如果已经是Date对象，检查是否有效
  if (value instanceof Date) {
    return !isNaN(value.getTime()) ? value : undefined;
  }

  return undefined;
}

/**
 * 安全地将日期字符串转换为Date对象
 * @param dateString 日期字符串，格式如'2023-03-15'
 * @param throwError 是否在转换失败时抛出异常
 * @returns 转换后的Date对象，如果转换失败且不抛出异常则返回null
 */
export function safeConvertToDate(
  dateString: string,
  throwError: boolean = false,
): Date | null {
  if (!dateString) {
    if (throwError) {
      throw new Error('日期字符串不能为空');
    }
    return null;
  }

  // 针对YYYY-MM-DD格式的处理
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // 确保使用UTC解析避免时区问题
    const [year, month, day] = dateString.split('-').map(Number);
    // 注意month需要减1，因为Date构造函数月份从0开始
    const date = new Date(Date.UTC(year, month - 1, day));

    if (!isNaN(date.getTime())) {
      return date;
    }
  } else {
    // 尝试标准解析
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // 处理转换失败的情况
  console.error(`日期转换失败: "${dateString}" 不是有效的日期格式`);
  if (throwError) {
    throw new Error(`无效的日期格式: ${dateString}`);
  }

  return null;
}

/**
 * 安全处理分页参数
 * @param page 页码
 * @param pageSize 每页记录数
 * @returns 处理后的安全分页参数
 */
export function safePaginationParams(
  page: any,
  pageSize: any,
): { page: number; pageSize: number } {
  let safePage = Number(page);
  let safePageSize = Number(pageSize);

  if (isNaN(safePage) || safePage < 1) safePage = 1;
  if (isNaN(safePageSize) || safePageSize < 1) safePageSize = 10;

  return { page: safePage, pageSize: safePageSize };
}

/**
 * 安全处理ID参数，确保ID是有效的数字
 * @param id 待处理的ID值
 * @param defaultValue 默认值，如果ID无效时返回，默认为null
 * @param throwError 是否抛出异常，默认为false
 * @returns 处理后的安全ID值
 */
export function safeIdParam(
  id: any,
  defaultValue: any = null,
  throwError: boolean = false,
): number | null {
  if (id === undefined || id === null) return defaultValue;

  const safeId = Number(id);
  if (isNaN(safeId)) {
    console.error(`无效的ID参数: ${id}`);

    if (throwError) {
      throw new InvalidIdParameterError(id);
    }

    return defaultValue;
  }

  return safeId;
}
