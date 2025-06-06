# 部门模块API

## 概述

部门模块提供组织架构管理功能，包括部门的创建、查询、更新、删除以及部门用户管理等。

## 基本路径

所有部门相关API都以`/api/departments`为前缀。

## API列表

### 获取部门树

获取完整的部门树结构。

**请求方法**: GET

**URL**: `/api/departments/tree`

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取部门树成功",
  "data": [
    {
      "id": 1,
      "name": "总公司",
      "code": "HQ",
      "level": 1,
      "sort": 1,
      "parentId": null,
      "leader": {
        "id": 1,
        "name": "管理员"
      },
      "children": [
        {
          "id": 2,
          "name": "技术部",
          "code": "TECH",
          "level": 2,
          "sort": 1,
          "parentId": 1,
          "leader": {
            "id": 3,
            "name": "技术总监"
          },
          "children": [
            {
              "id": 5,
              "name": "前端组",
              "code": "FRONTEND",
              "level": 3,
              "sort": 1,
              "parentId": 2,
              "leader": {
                "id": 5,
                "name": "前端负责人"
              },
              "children": []
            },
            {
              "id": 6,
              "name": "后端组",
              "code": "BACKEND",
              "level": 3,
              "sort": 2,
              "parentId": 2,
              "leader": {
                "id": 6,
                "name": "后端负责人"
              },
              "children": []
            }
          ]
        },
        {
          "id": 3,
          "name": "销售部",
          "code": "SALES",
          "level": 2,
          "sort": 2,
          "parentId": 1,
          "leader": {
            "id": 4,
            "name": "销售总监"
          },
          "children": []
        }
      ]
    }
  ]
}
```

### 获取部门列表

获取扁平化的部门列表，支持分页和筛选。

**请求方法**: GET

**URL**: `/api/departments`

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `keyword`: 搜索关键词，会匹配部门名称和编码
- `parentId`: 父部门ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取部门列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "总公司",
        "code": "HQ",
        "level": 1,
        "sort": 1,
        "parentId": null,
        "leaderId": 1,
        "leader": {
          "id": 1,
          "name": "管理员"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "技术部",
        "code": "TECH",
        "level": 2,
        "sort": 1,
        "parentId": 1,
        "leaderId": 3,
        "leader": {
          "id": 3,
          "name": "技术总监"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "totalItems": 6,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 1,
      "currentPage": 1
    }
  }
}
```

### 获取单个部门

根据部门ID获取单个部门的详细信息。

**请求方法**: GET

**URL**: `/api/departments/{id}`

**路径参数**:

- `id`: 部门ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取部门成功",
  "data": {
    "id": 2,
    "name": "技术部",
    "code": "TECH",
    "level": 2,
    "sort": 1,
    "parentId": 1,
    "leaderId": 3,
    "parent": {
      "id": 1,
      "name": "总公司"
    },
    "leader": {
      "id": 3,
      "name": "技术总监"
    },
    "userCount": 15,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 创建部门

创建新部门。

**请求方法**: POST

**URL**: `/api/departments`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "测试部",
  "code": "TEST",
  "parentId": 1,
  "leaderId": 7,
  "sort": 3
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "创建部门成功",
  "data": {
    "id": 7,
    "name": "测试部",
    "code": "TEST",
    "level": 2,
    "sort": 3,
    "parentId": 1,
    "leaderId": 7,
    "createdAt": "2023-02-01T00:00:00.000Z",
    "updatedAt": "2023-02-01T00:00:00.000Z",
    "leader": {
      "id": 7,
      "name": "测试负责人"
    },
    "parent": {
      "id": 1,
      "name": "总公司"
    }
  }
}
```

### 更新部门

更新部门信息。

**请求方法**: PUT

**URL**: `/api/departments/{id}`

**路径参数**:

- `id`: 部门ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "测试与质量部",
  "code": "QA",
  "leaderId": 8,
  "sort": 4
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新部门成功",
  "data": {
    "id": 7,
    "name": "测试与质量部",
    "code": "QA",
    "level": 2,
    "sort": 4,
    "parentId": 1,
    "leaderId": 8,
    "updatedAt": "2023-02-02T00:00:00.000Z",
    "leader": {
      "id": 8,
      "name": "新测试负责人"
    },
    "parent": {
      "id": 1,
      "name": "总公司"
    }
  }
}
```

### 删除部门

删除指定部门。

**请求方法**: DELETE

**URL**: `/api/departments/{id}`

**路径参数**:

- `id`: 部门ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除部门成功",
  "data": null
}
```

### 获取部门用户

获取部门下的所有用户。

**请求方法**: GET

**URL**: `/api/departments/{id}/users`

**路径参数**:

- `id`: 部门ID

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `keyword`: 搜索关键词，会匹配用户名、姓名和邮箱
- `includeChildDepts`: 是否包含子部门用户，默认为false

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取部门用户成功",
  "data": {
    "items": [
      {
        "id": 3,
        "username": "techlead",
        "name": "技术总监",
        "email": "techlead@example.com",
        "phone": "13800138003",
        "status": 1,
        "avatar": "https://example.com/avatar3.jpg",
        "roles": [
          {
            "id": 3,
            "name": "部门主管",
            "code": "dept_manager"
          }
        ],
        "roleNames": ["部门主管"],
        "departmentId": 2,
        "departmentName": "技术部",
        "position": "技术总监",
        "joinDate": "2022-01-01"
      },
      {
        "id": 5,
        "username": "frontend",
        "name": "前端负责人",
        "email": "frontend@example.com",
        "phone": "13800138005",
        "status": 1,
        "avatar": "https://example.com/avatar5.jpg",
        "roles": [
          {
            "id": 4,
            "name": "团队负责人",
            "code": "team_leader"
          }
        ],
        "roleNames": ["团队负责人"],
        "departmentId": 5,
        "departmentName": "前端组",
        "position": "前端负责人",
        "joinDate": "2022-02-01"
      }
    ],
    "meta": {
      "totalItems": 15,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 2,
      "currentPage": 1
    }
  }
}
```

### 添加用户到部门

将用户添加到指定部门。

**请求方法**: POST

**URL**: `/api/departments/{id}/users`

**路径参数**:

- `id`: 部门ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "userIds": [10, 11, 12],
  "position": "开发工程师"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "添加用户到部门成功",
  "data": {
    "successCount": 3,
    "failedCount": 0
  }
}
```

### 从部门移除用户

从部门中移除指定用户。

**请求方法**: DELETE

**URL**: `/api/departments/{id}/users/{userId}`

**路径参数**:

- `id`: 部门ID
- `userId`: 用户ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "从部门移除用户成功",
  "data": null
}
```

### 移动部门

移动部门到新的父部门下。

**请求方法**: PATCH

**URL**: `/api/departments/{id}/move`

**路径参数**:

- `id`: 部门ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "parentId": 3
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "移动部门成功",
  "data": {
    "id": 7,
    "name": "测试与质量部",
    "code": "QA",
    "level": 2,
    "parentId": 3,
    "updatedAt": "2023-02-03T00:00:00.000Z"
  }
}
```

## 错误响应

### 404 未找到

```json
{
  "statusCode": 404,
  "message": "部门不存在",
  "error": "Not Found"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "部门编码已存在",
  "error": "Bad Request"
}
```

### 403 禁止访问

```json
{
  "statusCode": 403,
  "message": "没有权限执行此操作",
  "error": "Forbidden"
}
```

## 注意事项

- 部门编码在系统内必须唯一
- 删除部门前需要先移除该部门下的所有用户
- 删除父部门会导致所有子部门被删除，请谨慎操作
- 只有具有`department:manage`权限的用户才能执行部门管理操作
- 部门层级最深不超过5层 