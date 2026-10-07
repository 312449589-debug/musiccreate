# 弦伴 MVP 前后端接口约定

版本：草案 v1  
状态：供前后端联调；音乐生成服务、账号方案和部署地址待确认。

## 1. 首版目标与范围

首版只打通一条核心流程：

> 吉他用户输入创作想法 → 生成短 Demo → 试听 → 保存作品 → 按作品练习并记录练习

本契约只覆盖上述流程。社区、推荐、公开分享、成长报告、录音上传、AI 演奏评分、歌词演唱和跨版本编辑不属于首版接口范围。首版只承诺返回可播放的 Demo 音频；和弦、谱面或教学内容与音频的一致性尚未定义，不应由前端假设服务端一定提供。

仓库当前是纯前端原型，作品和练习数据存浏览器，Demo 使用本地合成，不会调用 API。本文定义的是未来服务端接口，不代表这些接口已经部署。

## 2. 通用约定

- API 前缀：`/api/v1`
- 请求与响应：`application/json; charset=utf-8`
- 时间：RFC 3339 UTC，例如 `2026-10-07T13:00:00Z`
- ID：不透明字符串；前端不得解析 ID 的内部结构。
- 乐器：首版仅支持 `guitar`。界面可显示“吉他”或“木吉他”，请求统一传 `guitar`。
- 时长：`duration_seconds` 仅接受 `15`、`30`、`45`、`60`。
- 提示词：必填，去除首尾空白后为 1–1200 个字符。
- 作品和任务归属由服务端身份上下文确定；请求体不得自行指定 `user_id`。
- 生产环境建议前后端同源，通过 `/api/` 反向代理，避免浏览器跨域配置。开发环境使用 Vite proxy 或本地代理。
- 前端通过一个统一 API client 注入 `Authorization: Bearer <token>`（若部署启用认证）；登录、匿名身份创建与 token 获取方式尚待产品/后端确认。不要在页面代码里硬编码服务密钥。
- 生成请求必须发送 `Idempotency-Key`，避免网络重试造成重复生成或重复计费。推荐使用 `crypto.randomUUID()`；同一个逻辑请求重试时复用原 key，新的一次生成使用新 key。

成功响应直接返回资源 JSON；失败响应使用第 7 节定义的统一错误结构。

## 3. 核心数据模型

### Generation

```json
{
  "id": "gen_01J...",
  "status": "processing",
  "progress": null,
  "created_at": "2026-10-07T13:00:00Z",
  "updated_at": "2026-10-07T13:00:02Z",
  "result": null,
  "error": null
}
```

`status` 取值：

| 状态 | 含义 | 前端行为 |
|---|---|---|
| `queued` | 已受理，等待生成 | 显示“排队中”，继续查询 |
| `processing` | 生成中 | 显示“正在生成”，继续查询 |
| `succeeded` | 已生成试听 Demo | 显示结果、试听和保存入口 |
| `failed` | 生成失败 | 保留提示词和选项，显示错误并允许重试 |

`progress` 为 `0`–`100` 的整数或 `null`。只有服务端能提供有意义的进度时才返回数字；前端不得自行伪造进度。成功时 `result` 必须存在；非成功状态下为 `null`。失败时 `error` 必须存在；非失败状态下为 `null`。

### GenerationResult

```json
{
  "title": "晚一点回家",
  "style": "温暖民谣",
  "instrument": "guitar",
  "duration_seconds": 45,
  "audio": {
    "url": "https://media.example.com/temporary-audio-url",
    "expires_at": "2026-10-07T14:00:00Z"
  }
}
```

`audio.url` 是可由浏览器音频播放器访问的 URL；如 URL 会过期，必须返回 `expires_at`。前端遇到 URL 过期时重新读取任务或作品资源取得新 URL。不得假定响应中含歌词、和弦或谱面。

### Work

```json
{
  "id": "work_01J...",
  "generation_id": "gen_01J...",
  "title": "晚一点回家",
  "prompt": "想写一段关于城市夜晚的温暖木吉他民谣",
  "instrument": "guitar",
  "duration_seconds": 45,
  "style": "温暖民谣",
  "audio": {
    "url": "https://media.example.com/temporary-audio-url",
    "expires_at": "2026-10-07T14:00:00Z"
  },
  "created_at": "2026-10-07T13:05:00Z"
}
```

保存的是已经生成的 Demo，不是重新生成任务。成功保存后，作品出现在“我的作品”列表中，且可再次读取和试听。

## 4. 接口

### 4.1 创建生成任务

`POST /api/v1/generations`

请求：

```http
POST /api/v1/generations HTTP/1.1
Content-Type: application/json
Idempotency-Key: 2fa04df2-9476-4a3d-b8d1-c254a359cbd1
Authorization: Bearer <token>
```

```json
{
  "prompt": "想写一段关于城市夜晚和回家路上的温暖音乐",
  "instrument": "guitar",
  "duration_seconds": 45,
  "purpose": "practice",
  "style_tags": ["warm", "folk", "strumming"]
}
```

字段：

| 字段 | 必填 | 说明 |
|---|---:|---|
| `prompt` | 是 | 用户创作想法，1–1200 字符 |
| `instrument` | 是 | 固定为 `guitar` |
| `duration_seconds` | 是 | `15`、`30`、`45` 或 `60` |
| `purpose` | 是 | `inspiration`（寻找创作灵感）或 `practice`（生成练习曲） |
| `style_tags` | 否 | 标签数组，最多 10 项，每项最多 32 字符；无标签传 `[]` 或省略 |

成功：`202 Accepted`，响应体为 Generation。`Location` 响应头可提供 `GET /api/v1/generations/{id}` 地址。提交成功只代表任务已受理，不代表音频已生成。

同一 `Idempotency-Key` 与相同请求重复提交，应返回同一任务；同 key 不同请求应返回 `409 IDEMPOTENCY_KEY_REUSED`。

### 4.2 查询生成任务

`GET /api/v1/generations/{generation_id}`

成功：`200 OK`，响应体为 Generation。任务完成后，`result.audio.url` 用于试听。

前端轮询建议：

1. 收到 `202` 后立即显示“排队中/正在生成”。
2. 约每 2 秒查询一次；如果响应有 `Retry-After`，优先遵循该值。
3. 持续超过 30 秒后，将间隔逐步放宽，最大 10 秒；仅在 `succeeded` 或 `failed` 时停止轮询。
4. 网络暂时失败时保留任务 ID 和表单内容，采用退避重试；不要重新 POST 新任务。
5. 页面重新打开且本地保留有未完成的 generation ID 时，可继续查询该任务。

### 4.3 保存 Demo 为作品

`POST /api/v1/works`

请求：

```json
{
  "generation_id": "gen_01J...",
  "title": "晚一点回家"
}
```

`generation_id` 必填，且必须属于当前用户并已成功。`title` 可选，1–120 字符；省略时由服务端使用生成结果标题。

成功：`201 Created`，响应体为 Work。若同一个已成功 generation 重复保存，服务端应返回已创建的同一作品（`200 OK` 或 `201 Created`），不得创建重复作品。

### 4.4 获取作品列表

`GET /api/v1/works?limit=20&cursor=<opaque-cursor>`

- `limit` 可选，默认 20，范围 1–100。
- `cursor` 可选；服务端未提供下一页时 `next_cursor` 为 `null`。

成功：

```json
{
  "items": [
    {
      "id": "work_01J...",
      "generation_id": "gen_01J...",
      "title": "晚一点回家",
      "prompt": "想写一段关于城市夜晚的温暖木吉他民谣",
      "instrument": "guitar",
      "duration_seconds": 45,
      "style": "温暖民谣",
      "audio": {
        "url": "https://media.example.com/temporary-audio-url",
        "expires_at": "2026-10-07T14:00:00Z"
      },
      "created_at": "2026-10-07T13:05:00Z"
    }
  ],
  "next_cursor": null
}
```

### 4.5 获取单个作品

`GET /api/v1/works/{work_id}`

成功：`200 OK`，响应体为 Work。用于作品详情、再次试听和练习页加载。该接口也应提供新的可播放音频 URL（如有时效）。

### 4.6 记录一次练习

`POST /api/v1/works/{work_id}/practice-sessions`

首版记录的是用户主动提交的练习记录，不上传麦克风录音、不自动评估演奏能力。

请求：

```json
{
  "duration_seconds": 900,
  "completed_at": "2026-10-07T13:30:00Z",
  "completion_confirmed": false
}
```

| 字段 | 必填 | 说明 |
|---|---:|---|
| `duration_seconds` | 是 | 本次用户确认的练习时长，整数，1–86400 |
| `completed_at` | 是 | 用户结束练习的时间 |
| `completion_confirmed` | 是 | 用户是否主动确认已弹会目标段落；不表示系统验证 |

成功：`201 Created`。

```json
{
  "id": "practice_01J...",
  "work_id": "work_01J...",
  "duration_seconds": 900,
  "completed_at": "2026-10-07T13:30:00Z",
  "completion_confirmed": false,
  "created_at": "2026-10-07T13:30:01Z"
}
```

若当前前端的练习计时器尚未实现，仅在用户明确保存/结束本次练习时调用，不要因打开练习页而写入记录。

## 5. 统一错误响应

所有非 2xx 错误使用以下结构：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "duration_seconds must be one of 15, 30, 45, 60",
    "details": {
      "field": "duration_seconds"
    },
    "request_id": "req_01J..."
  }
}
```

`message` 是可供日志/开发调试使用的说明；面向用户的提示优先由前端按 `code` 本地化，不直接把内部异常或堆栈展示给用户。

| HTTP | `code` 示例 | 前端行为 |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | 标记相应输入，保留用户填写内容 |
| 401 | `UNAUTHENTICATED` | 按身份方案重新认证；认证方案待确认 |
| 403 | `FORBIDDEN` | 提示无权访问，不继续重试 |
| 404 | `GENERATION_NOT_FOUND`、`WORK_NOT_FOUND` | 提示资源不存在或已不可用 |
| 409 | `IDEMPOTENCY_KEY_REUSED`、`GENERATION_NOT_READY` | 按错误提示处理；不要重复创建任务 |
| 413 | `PROMPT_TOO_LARGE` | 提示缩短输入并保留原文本供编辑 |
| 429 | `RATE_LIMITED` | 按 `Retry-After` 等待后允许重试 |
| 502/503/504 | `GENERATION_PROVIDER_ERROR`、`SERVICE_UNAVAILABLE` | 保留输入/已有作品，显示可重试状态 |
| 500 | `INTERNAL_ERROR` | 显示通用错误，保留输入；可安全重试的请求复用原幂等 key |

生成任务自身失败仍由 `GET /generations/{id}` 返回 `200 OK` 和 `status: "failed"`；这与查询接口 HTTP 错误不同。

## 6. 前端接入约定

1. 统一封装 `fetch`，设置 API base URL、JSON 头、认证头和错误解析；页面组件不要散落拼接 URL。
2. Base URL 默认 `/api/v1`。纯 HTML/JS 版本可在部署配置中注入 API base URL；不要把服务商 API key 放在浏览器。
3. 生成按钮只提交一次任务；提交后禁用按钮并保留 prompt、标签、时长和用途。轮询任务直到终态。
4. `succeeded` 后把音频 URL 交给现有播放器；任务结果在用户点“保存 Demo”前仍是未保存草稿。
5. 保存按钮调用 `POST /works`，成功后用返回的 Work 更新作品列表；失败时保留结果和音频，允许重试。
6. 作品页和练习页以服务端 Work 为准。不要把 AI 试听算作练习或完成记录。
7. 练习记录只有服务端确认成功后才显示“已保存”；失败时保留表单内容，允许重试。
8. 不要在生产环境静默切回本地假生成或伪造保存成功。可在开发环境使用明确标记的 mock adapter。
9. 浏览器直接播放音频时，媒体 URL 必须可由浏览器访问；若媒体跨域，媒体服务需正确设置 CORS。长音频建议支持 HTTP Range 请求。
10. 生成服务密钥、对象存储密钥等只允许保存在服务端。

## 7. 联调验收清单

- [ ] 合法生成请求返回 `202` 和 generation ID；非法字段返回统一错误。
- [ ] 相同幂等 key 重试不会创建第二个任务。
- [ ] 前端能够显示排队、生成中、成功和失败状态；失败不清空输入。
- [ ] 成功任务的音频 URL 能在浏览器播放。
- [ ] 保存成功后刷新页面仍能从作品列表加载并试听作品。
- [ ] 重复保存同一 generation 不产生重复作品。
- [ ] 练习记录由用户主动提交；保存后能与对应作品关联。
- [ ] 权限隔离：用户不能读取、保存或记录其他用户的任务和作品。
- [ ] 生产构建中不包含任何音乐生成服务密钥。

## 8. 开始实现前需要确认

1. 选择哪家音乐生成服务，能否稳定返回可试听音频、时长和许可信息。
2. 账号/匿名身份方案，以及是否首版支持跨设备访问作品。
3. 音频保存、URL 时效、生成结果保留时长与删除策略。
4. 服务调用成本、单用户限额、速率限制和失败重试策略。
5. 部署时 API 是否与网页同源，开发代理地址是什么。

以上决策未确认前，前端可以按本契约实现 API client 和 loading/error 状态；涉及 token 获取、真实媒体格式和服务商限制的部分应通过适配层保留，不要写死供应商细节。
