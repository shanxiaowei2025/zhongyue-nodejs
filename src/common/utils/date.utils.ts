/**
 * 日期工具类
 * 提供处理日期时区和格式化的工具方法
 */
export class DateUtils {
  /**
   * 获取当前 UTC 时间
   * @returns {Date} 当前的 UTC 时间
   */
  static getUtcNow(): Date {
    return new Date();
  }

  /**
   * 将日期转换为 ISO 格式的 UTC 字符串
   * @param {Date} date 日期对象
   * @returns {string} ISO 格式的 UTC 字符串
   */
  static toUtcIsoString(date: Date): string {
    return date.toISOString();
  }

  /**
   * 从本地时间字符串创建 UTC 日期对象
   * @param {string} dateStr 日期字符串
   * @returns {Date} UTC 日期对象
   */
  static fromLocalToUtc(dateStr: string): Date {
    const date = new Date(dateStr);
    return new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
      ),
    );
  }

  /**
   * 格式化日期为 YYYY-MM-DD 格式
   * @param {Date} date 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 格式化日期时间为 YYYY-MM-DD HH:MM:SS 格式
   * @param {Date} date 日期对象
   * @returns {string} 格式化后的日期时间字符串
   */
  static formatDateTime(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }
}
