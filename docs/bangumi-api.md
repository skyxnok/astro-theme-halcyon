# Bangumi 番组计划 API 文档

本文档说明博客「番组计划」页面（`/bangumi/`）前端请求和消费的数据格式，供自定义后端 API 参考。

## 1. 请求格式

前端会按以下格式请求你的 API：

```
GET {apiUrl}/v0/users/{username}/collections?subject_type={type}&limit={limit}&offset={offset}
```

请求头：

```
Accept: application/json
```

参数说明：

| 参数 | 类型 | 说明 |
|------|------|------|
| `username` | string | Bangumi 用户 ID，如 `skyxnok` |
| `subject_type` | number | 条目类型：`1`=书籍，`2`=动画，`3`=音乐，`4`=游戏，`6`=三次元 |
| `limit` | number | 每页数量（配置为 50） |
| `offset` | number | 偏移量，从 0 开始 |
| `refresh` | number | 可选。`1` 时强制绕过 Worker 缓存回源（默认数据缓存 5 分钟） |

前端会循环请求直到 `batch.length < limit` 或 `batch` 为空为止（即最后一页）。默认最多获取 1000 条。

### 缓存与数据源

- 数据文件从 `raw.githubusercontent.com` 读取，**始终与 GitHub 仓库同步**，不依赖第三方 CDN
- 数据缓存 5 分钟（Worker 环境变量 `CACHE_TTL` 可调），带 `?refresh=1` 可强制回源
- 封面图片由 Worker 代理为同源 `/images/...` 地址（缓存 1 天，`IMAGE_CACHE_TTL` 可调，同样支持 `?refresh=1`）
- 数据更新时机：每 3 小时自动同步 + push 触发 + GitHub Actions 手动触发（**Sync Bangumi Data → Run workflow**）

## 2. 响应格式（分页外壳）

```json
{
  "data": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

- 前端只使用 `data` 字段
- `total` / `limit` / `offset` 类型中有定义但页面代码未使用，可任意填写
- `data` 为空数组表示没有更多数据

## 3. 每条完整结构（UserSubjectCollection）

```json
{
  "subject_id": 1,
  "subject_type": 2,
  "rate": 8,
  "type": 2,
  "comment": "观后感",
  "tags": ["科幻", "剧情"],
  "ep_status": 12,
  "vol_status": 0,
  "updated_at": "2026-08-01T10:00:00+08:00",
  "private": false,
  "subject": {
    "id": 1,
    "type": 2,
    "name": "Steins;Gate",
    "name_cn": "命运石之门",
    "short_summary": "简介文字",
    "date": "2011-04-06",
    "images": {
      "large": "https://example.com/large.jpg",
      "common": "https://example.com/common.jpg",
      "medium": "https://example.com/medium.jpg",
      "small": "https://example.com/small.jpg",
      "grid": "https://example.com/grid.jpg"
    },
    "volumes": 0,
    "eps": 24,
    "collection_total": 10000,
    "score": 9.1,
    "rank": 1,
    "tags": [
      { "name": "科幻", "count": 500, "total_cont": 600 }
    ]
  }
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `subject_id` | number | 条目 ID |
| `subject_type` | number | 条目类型（同请求参数） |
| `rate` | number | 我的评分（0-10） |
| `type` | number | 收藏类型：`1`=想看，`2`=看过，`3`=在看，`4`=搁置，`5`=抛弃 |
| `comment` | string/null | 我的评价 |
| `tags` | string[] | 我的标签 |
| `ep_status` | number | 看到第几集 |
| `vol_status` | number | 看到第几卷 |
| `updated_at` | string | 更新时间（ISO 8601） |
| `private` | boolean | 是否私有 |
| `subject.id` | number | 条目 ID（用于拼接详情链接） |
| `subject.name` | string | 日文/原文名 |
| `subject.name_cn` | string | 中文名 |
| `subject.date` | string | 发售/播出日期，`YYYY-MM-DD` |
| `subject.images.medium` | string | 封面图（卡片实际使用 medium）；实际 API 返回同源地址，如 `https://data.201562.xyz/images/anime/123.avif` |
| `subject.score` | number | 条目评分 |
| `subject.tags` | SubjectTag[] | 条目标签（`name` / `count` / `total_cont`） |

## 4. 页面实际使用的字段（卡片渲染）

卡片组件（`Card.svelte`）实际消费以下字段：

| 用途 | 字段 |
|------|------|
| 封面图 | `subject.images.medium` |
| 标题 | `subject.name_cn \|\| subject.name` |
| 年份 | `subject.date`（取前 4 位） |
| 状态徽章 | `type`（1-5 映射颜色和文字） |
| 评分徽章 | `subject.score` |
| 详情链接 | `subject.id` → `{subjectBaseUrl}{id}` |
| 标签 | `tags`（我的）或 `subject.tags`（条目），最多显示 3 个 |

其余字段（`rate`、`comment`、`ep_status`、`vol_status`、`short_summary` 等）页面暂未使用，缺失不影响渲染。

## 5. 最小可用响应示例

```json
{
  "data": [
    {
      "type": 2,
      "subject": {
        "id": 1,
        "name": "Steins;Gate",
        "name_cn": "命运石之门",
        "date": "2011-04-06",
        "images": { "medium": "https://example.com/medium.jpg" },
        "score": 9.1
      }
    }
  ]
}
```

## 6. 如何切换到你自己的 API

在 `src/config/siteConfig.ts` 的 `bangumi` 配置中修改：

```ts
bangumi: {
  userId: "skyxnok",
  mode: "dynamic", // dynamic=浏览器实时请求你的 API
  apiUrl: "https://your-api.example.com", // 替换成你自己的 API 地址
  subjectBaseUrl: "https://bgm.tv/subject/", // 条目详情页地址
  categoryOrder: ["anime", "book", "music", "game", "real"],
}
```

要求：

- API 需支持 CORS（浏览器跨域请求）
- `dynamic` 模式下由浏览器直接请求；`static` 模式下由构建服务器请求
