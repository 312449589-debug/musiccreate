# 弦伴 · 接口对齐版 MVP

纯 HTML、CSS、JavaScript，保留原有桌面和移动端视觉样式。按用户提供的《API_CONTRACT.md》草案 v1 接入。此版需要真实后端；不会静默切回本地合成音频或假保存。

## 部署文件

必须一起上传这五个文件，并保持在同一个目录：

- index.html：页面入口。
- styles.css：响应式样式。
- config.js：部署和身份配置，先加载。
- api-client.js：统一请求、JSON 解析、认证、超时、错误提示、限流处理。
- app.js：生成、播放、作品与练习交互。

README.md、API_CONTRACT.md 和 INTEGRATION_CHECKS.md 是说明文件，不需要公开部署。

覆盖原网页前请备份当前服务器上的文件。旧版只上传三个文件的操作不再适用。替换后强制刷新浏览器，必要时清除网站的静态资源缓存。

## API 配置

默认同源 `/api/v1`，在 config.js 的 apiBaseUrl 修改。该配置指向你的应用后端，不是音乐服务商接口。

例如网页在 `https://music.example.com/`，生成请求发送至 `https://music.example.com/api/v1/generations`。

Nginx 可在现有网站 server 配置中加入以下代理位置。8000 仅为示例，替换为实际后端端口；保留现有网站与 SSH 设置。proxy_pass 不带末尾斜杠，保留完整 `/api/v1/...` 路径：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

若后端部署在其他域名，修改 apiBaseUrl 为完整 HTTPS API 前缀，后端须允许网页来源、Authorization、Content-Type、Idempotency-Key 请求头，并暴露 Retry-After；同源代理更简单。

直接 file:// 打开页面无法正常接入默认 API，需要通过网站服务访问。本地 Python 静态服务器也不会转发 API；出现接口不可用提示是预期行为。

## 身份适配

契约尚未定义登录接口。本版本不虚构登录功能。

config.js 的 getAccessToken 默认返回 null，适用于后端已明确支持匿名的部署。启用认证时，将它接到实际登录流程的用户 token 提供器；API client 统一添加 `Authorization: Bearer ...`。401 会调用 onUnauthorized，默认显示尚未认证的提示；可由登录适配层引导重新认证。

不要硬编码音乐服务商密钥、对象存储密钥或管理 token。前端不保存 access token；身份提供器负责其生命周期。

切换账号时应设置不同的 storageScope，并重新加载页面，以隔离本机未完成任务及草稿。后端仍必须实施用户归属检查；前端不发送 user_id。

## 已对齐的流程

- 生成：POST /generations，固定 guitar、15/30/45/60 秒、用途与英文风格标签。去除提示词首尾空格，校验 1–1200 字符。
- 幂等：每次新生成创建 UUID；不确定的提交失败保留请求内容与 key，重试复用。POST 已返回任务 ID 后只 GET 查询，不重新生成。
- 轮询：显示 queued、processing、succeeded、failed。仅展示服务端返回的真实 progress；优先 Retry-After。30 秒后逐步放宽至 10 秒；暂时性查询错误自动退避，身份/权限/不存在等错误暂停查询。
- 恢复：本机保存任务 ID、请求与未保存草稿标识。刷新或重新打开后继续查询；成功草稿重新读取任务音频。
- 试听：HTML Audio 播放服务器 audio.url，支持暂停、进度、音量，以及练习页降速、循环。URL 已过期或媒体错误时重新读取资源取得新 URL；失败则明确提示。
- 保存：POST /works，只有响应成功才显示已保存；失败保留试听 Demo。同 generation 重复保存去重依赖契约约定的后端行为。
- 作品：GET /works，支持 next_cursor 分页；详情与练习入口 GET /works/{id}，不透明 ID 均 URL 编码。
- 练习：用户明确提交才 POST /works/{id}/practice-sessions。整数分钟转秒，UTC completed_at，completion_confirmed 默认 false；服务端确认后显示已保存。不会因打开页面或试听写入记录。
- 错误：本地化错误 code，不展示后端内部 message/堆栈；保留 request_id 供排查。429 按 Retry-After 等待，25 秒请求超时。

## 首版范围与原型差异

未定义接口的社区、推荐、成长统计、歌词/和弦/版本编辑、删除、分享及录音上传功能不生成虚假数据。社区与成长入口显示尚未接入。首页音乐区域展示已保存的服务端作品。

个人偏好和近期练习目标仅保存在本机。作品不再以 localStorage 为权威来源；旧版 xianban-mvp-v1 数据保持原样，未自动上传或迁移，旧本地作品不会混入服务端列表。

练习接口没有幂等键或查询历史的约定。本版防止同时提交和短时间重复点击，不自动重试练习 POST；若响应在提交后丢失，保留表单和 completed_at，提示先核对后台记录。需要后端补充幂等或记录查询，才能保证这种情况下重试不重复。

## 当前验证边界

自动化请求测试与浏览器模拟接口流程已通过，见 INTEGRATION_CHECKS.md。模拟音频只用于验证播放器，不是 AI 生成效果。正式包不包含 mock adapter、测试音频或供应商密钥。

尚需真实后端 URL、身份方案及媒体服务进行最终联调，特别是跨设备作品加载、音频 URL 更新、限流与权限隔离。服务器上的前端文件并未由本次修改自动更新，需要上传本包。
