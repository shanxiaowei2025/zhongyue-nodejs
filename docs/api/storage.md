# 存储模块API

## 概述

存储模块提供文件存储和管理相关功能，包括文件上传、下载、删除等操作。系统支持多种存储策略，包括本地存储、云存储等。

## 基本路径

所有存储相关API都以`/api/storage`为前缀。

## API列表

### 上传文件

上传单个文件到服务器。

**请求方法**: POST

**URL**: `/api/storage/upload`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**请求体**:

```
file: [文件]
module: "customer" // 可选，指定文件所属模块
description: "客户合同附件" // 可选，文件描述
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "上传文件成功",
  "data": {
    "id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
    "originalName": "example.pdf",
    "filename": "1642342312345_example.pdf",
    "path": "/uploads/customer/2023/01/16/1642342312345_example.pdf",
    "url": "https://api.example.com/uploads/customer/2023/01/16/1642342312345_example.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "module": "customer",
    "description": "客户合同附件",
    "createdBy": {
      "id": 1,
      "name": "管理员"
    },
    "createdAt": "2023-01-16T10:25:12.345Z",
    "updatedAt": "2023-01-16T10:25:12.345Z"
  }
}
```

### 批量上传文件

同时上传多个文件到服务器。

**请求方法**: POST

**URL**: `/api/storage/batch-upload`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**请求体**:

```
files: [文件数组]
module: "contract" // 可选，指定文件所属模块
description: "合同相关附件" // 可选，文件描述
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "批量上传文件成功",
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p",
      "originalName": "contract.pdf",
      "filename": "1642342355111_contract.pdf",
      "path": "/uploads/contract/2023/01/16/1642342355111_contract.pdf",
      "url": "https://api.example.com/uploads/contract/2023/01/16/1642342355111_contract.pdf",
      "size": 2048000,
      "mimeType": "application/pdf",
      "module": "contract",
      "description": "合同相关附件",
      "createdBy": {
        "id": 1,
        "name": "管理员"
      },
      "createdAt": "2023-01-16T10:25:55.111Z",
      "updatedAt": "2023-01-16T10:25:55.111Z"
    },
    {
      "id": "p6o5n4m3-l2k1-j0i9-h8g7-f6e5d4c3b2a1",
      "originalName": "signature.png",
      "filename": "1642342355222_signature.png",
      "path": "/uploads/contract/2023/01/16/1642342355222_signature.png",
      "url": "https://api.example.com/uploads/contract/2023/01/16/1642342355222_signature.png",
      "size": 50000,
      "mimeType": "image/png",
      "module": "contract",
      "description": "合同相关附件",
      "createdBy": {
        "id": 1,
        "name": "管理员"
      },
      "createdAt": "2023-01-16T10:25:55.222Z",
      "updatedAt": "2023-01-16T10:25:55.222Z"
    }
  ]
}
```

### 获取文件信息

获取单个文件的详细信息。

**请求方法**: GET

**URL**: `/api/storage/{id}`

**路径参数**:

- `id`: 文件ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取文件信息成功",
  "data": {
    "id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
    "originalName": "example.pdf",
    "filename": "1642342312345_example.pdf",
    "path": "/uploads/customer/2023/01/16/1642342312345_example.pdf",
    "url": "https://api.example.com/uploads/customer/2023/01/16/1642342312345_example.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "module": "customer",
    "description": "客户合同附件",
    "createdBy": {
      "id": 1,
      "name": "管理员"
    },
    "createdAt": "2023-01-16T10:25:12.345Z",
    "updatedAt": "2023-01-16T10:25:12.345Z"
  }
}
```

### 下载文件

下载指定文件。

**请求方法**: GET

**URL**: `/api/storage/{id}/download`

**路径参数**:

- `id`: 文件ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

文件内容（二进制流）

### 删除文件

删除指定文件。

**请求方法**: DELETE

**URL**: `/api/storage/{id}`

**路径参数**:

- `id`: 文件ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除文件成功",
  "data": null
}
```

### 批量删除文件

批量删除多个文件。

**请求方法**: POST

**URL**: `/api/storage/batch-delete`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "ids": ["f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l", "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p"]
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "批量删除文件成功",
  "data": {
    "success": 2,
    "failed": 0
  }
}
```

### 获取文件列表

获取文件列表，支持分页和筛选。

**请求方法**: GET

**URL**: `/api/storage`

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `sort`: 排序字段，例如`createdAt`
- `order`: 排序方向，`ASC`或`DESC`
- `module`: 文件所属模块
- `mimeType`: 文件MIME类型
- `keyword`: 搜索关键词，会匹配文件名和描述

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取文件列表成功",
  "data": {
    "items": [
      {
        "id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
        "originalName": "example.pdf",
        "filename": "1642342312345_example.pdf",
        "url": "https://api.example.com/uploads/customer/2023/01/16/1642342312345_example.pdf",
        "size": 1024000,
        "mimeType": "application/pdf",
        "module": "customer",
        "description": "客户合同附件",
        "createdBy": {
          "id": 1,
          "name": "管理员"
        },
        "createdAt": "2023-01-16T10:25:12.345Z"
      },
      {
        "id": "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p",
        "originalName": "contract.pdf",
        "filename": "1642342355111_contract.pdf",
        "url": "https://api.example.com/uploads/contract/2023/01/16/1642342355111_contract.pdf",
        "size": 2048000,
        "mimeType": "application/pdf",
        "module": "contract",
        "description": "合同相关附件",
        "createdBy": {
          "id": 1,
          "name": "管理员"
        },
        "createdAt": "2023-01-16T10:25:55.111Z"
      }
    ],
    "meta": {
      "totalItems": 10,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 1,
      "currentPage": 1
    }
  }
}
```

### 更新文件信息

更新文件的描述等元数据信息。

**请求方法**: PUT

**URL**: `/api/storage/{id}`

**路径参数**:

- `id`: 文件ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "description": "已签署的客户合同",
  "module": "contract"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新文件信息成功",
  "data": {
    "id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
    "originalName": "example.pdf",
    "description": "已签署的客户合同",
    "module": "contract",
    "updatedAt": "2023-01-20T15:30:45.678Z"
  }
}
```

## 错误响应

### 404 未找到

```json
{
  "statusCode": 404,
  "message": "文件不存在",
  "error": "Not Found"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "文件大小超过限制",
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

- 文件上传大小限制为10MB
- 支持的文件类型包括：图片(jpg, png, gif)、文档(pdf, doc, docx, xls, xlsx)、压缩包(zip, rar)等
- 文件命名规则：时间戳_原始文件名
- 文件按模块和日期分目录存储
- 删除文件为物理删除，请谨慎操作
- 只有文件上传者和具有`storage:manage`权限的用户才能删除文件 