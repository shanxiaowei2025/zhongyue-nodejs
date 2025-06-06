# 认证模块API

## 概述

认证模块提供用户登录、注册、刷新令牌等功能，是系统安全的核心部分。

## 基本路径

所有认证相关API都以`/api/auth`为前缀。

## API列表

### 登录

用户登录并获取JWT令牌。

**请求方法**: POST

**URL**: `/api/auth/login`

**请求体**:

```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "email": "admin@example.com",
      "roles": ["admin"]
    }
  }
}
```

### 注册

注册新用户账号。

**请求方法**: POST

**URL**: `/api/auth/register`

**请求体**:

```json
{
  "username": "newuser",
  "password": "password123",
  "name": "新用户",
  "email": "newuser@example.com",
  "phone": "13800138000"
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "注册成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "name": "新用户",
    "email": "newuser@example.com",
    "phone": "13800138000",
    "status": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 刷新令牌

使用刷新令牌获取新的访问令牌。

**请求方法**: POST

**URL**: `/api/auth/refresh`

**请求头**:

```
Authorization: Bearer {refreshToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "刷新令牌成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### 登出

使当前令牌失效，用户登出系统。

**请求方法**: POST

**URL**: `/api/auth/logout`

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "登出成功",
  "data": null
}
```

### 获取当前用户信息

获取当前登录用户的详细信息。

**请求方法**: GET

**URL**: `/api/auth/profile`

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取用户信息成功",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "status": 1,
    "roles": [
      {
        "id": 1,
        "name": "管理员",
        "code": "admin",
        "permissions": [
          {
            "id": 1,
            "name": "用户管理",
            "code": "user:manage"
          },
          {
            "id": 2,
            "name": "角色管理",
            "code": "role:manage"
          }
        ]
      }
    ],
    "departments": [
      {
        "id": 1,
        "name": "技术部",
        "code": "tech"
      }
    ]
  }
}
```

### 修改密码

修改当前用户的密码。

**请求方法**: PUT

**URL**: `/api/auth/change-password`

**请求头**:

```
Authorization: Bearer {accessToken}
```

**请求体**:

```json
{
  "oldPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "密码修改成功",
  "data": null
}
```

### 忘记密码

发送密码重置邮件。

**请求方法**: POST

**URL**: `/api/auth/forgot-password`

**请求体**:

```json
{
  "email": "user@example.com"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "密码重置邮件已发送",
  "data": null
}
```

### 重置密码

使用重置令牌设置新密码。

**请求方法**: POST

**URL**: `/api/auth/reset-password`

**请求体**:

```json
{
  "token": "reset_token_here",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "密码重置成功",
  "data": null
}
```

## 错误响应

### 401 未授权

```json
{
  "statusCode": 401,
  "message": "未授权",
  "error": "Unauthorized"
}
```

### 403 禁止访问

```json
{
  "statusCode": 403,
  "message": "禁止访问",
  "error": "Forbidden"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "用户名或密码错误",
  "error": "Bad Request"
}
```

## 认证流程

1. 用户通过`/api/auth/login`获取访问令牌和刷新令牌
2. 使用访问令牌访问受保护的API
3. 访问令牌过期后，使用刷新令牌获取新的访问令牌
4. 用户登出时，通过`/api/auth/logout`使令牌失效

## 注意事项

- 访问令牌默认有效期为24小时
- 刷新令牌默认有效期为7天
- 密码必须包含大小写字母、数字和特殊字符，长度至少为8位
- 多次登录失败可能导致账号临时锁定 