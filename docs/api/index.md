# API文档

## 概述

中岳信息管理系统后端提供了一系列RESTful API，用于与前端系统进行交互。所有API均遵循RESTful设计原则，使用JWT进行身份认证。

## API路径前缀

所有API均使用`/api`作为路径前缀，例如：

```
GET /api/users
POST /api/auth/login
```

## 认证方式

除了少数公开接口外，大多数API需要进行身份认证。认证方式为在HTTP请求头中添加`Authorization`字段，值为`Bearer {token}`，其中`{token}`为登录后获取的JWT令牌。

例如：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 请求格式

- 对于`GET`请求，参数通过URL查询字符串传递
- 对于`POST`、`PUT`、`PATCH`请求，参数通过JSON格式的请求体传递
- 请求头需要设置`Content-Type: application/json`

## 响应格式

所有API响应均为JSON格式，标准响应结构如下：

```json
{
  "statusCode": 200,
  "message": "操作成功",
  "data": { ... }
}
```

如果发生错误，响应结构为：

```json
{
  "statusCode": 400,
  "message": "错误信息",
  "error": "错误类型"
}
```

## 状态码说明

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或认证失败
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## Swagger文档

系统集成了Swagger文档，可以通过访问`/api/docs`路径查看完整的API文档，并进行接口测试。

## API模块

- [认证模块](./auth): 用户登录、注册、刷新令牌等
- [用户模块](./users): 用户管理相关接口
- [部门模块](./departments): 部门管理相关接口
- [客户模块](./customers): 客户管理相关接口
- [角色模块](./roles): 角色管理相关接口
- [权限模块](./permissions): 权限管理相关接口
- [合同模块](./contract): 合同管理相关接口
- [费用模块](./expense): 费用管理相关接口
- [存储模块](./storage): 文件上传下载相关接口 