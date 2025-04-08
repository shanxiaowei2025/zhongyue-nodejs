/**
 * 生产环境中的空Swagger装饰器实现
 * 这些装饰器在生产环境中不会执行任何操作
 */

// 类装饰器
export const ApiTags = (name?: string): ClassDecorator => {
    return (target: any) => target;
  };
  
  // 方法装饰器
  export const ApiOperation = (options: any): MethodDecorator => {
    return () => {};
  };
  
  export const ApiResponse = (options: any): MethodDecorator => {
    return () => {};
  };
  
  export const ApiBearerAuth = (): MethodDecorator => {
    return () => {};
  };
  
  export const ApiExcludeEndpoint = (): MethodDecorator => {
    return () => {}; 
  };
  
  export const ApiParam = (options: any): MethodDecorator => {
    return () => {};
  };
  
  export const ApiQuery = (options: any): MethodDecorator => {
    return () => {};
  };
  
  export const ApiBody = (options: any): MethodDecorator => {
    return () => {};
  };
  
  // 属性装饰器
  export const ApiProperty = (options?: any): PropertyDecorator => {
    return () => {};
  };
  
  export const ApiPropertyOptional = (options?: any): PropertyDecorator => {
    return () => {};
  };
  
  export const ApiHideProperty = (): PropertyDecorator => {
    return () => {};
  };
  
  // 其他API
  export const SwaggerModule = {
    createDocument: () => ({}),
    setup: () => ({}),
  };
  
  export const DocumentBuilder = function() {
    return {
      setTitle: () => this,
      setDescription: () => this,
      setVersion: () => this,
      addBearerAuth: () => this,
      addTag: () => this,
      build: () => ({}),
    };
  };