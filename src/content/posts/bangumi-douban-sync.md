---
title: 观阅计划数据管线：Bangumi + 豆瓣收藏同步实践
published: 2026-08-09T12:00:00+08:00
pinned: false
description: 用 GitHub Actions 定时同步 Bangumi 与豆瓣收藏，封面转 AVIF 走 CDN，Cloudflare Worker 提供 API，事务化更新保证数据安全——完整实践与踩坑记录。
tags: [观阅计划, Bangumi, 豆瓣, GitHub Actions, Cloudflare Worker]
category: 教程
draft: false

image: /images/covers/bangumi-douban-sync.avif
---

> 本文记录我博客「观阅计划」页面背后的数据管线：如何同时拿到 **Bangumi** 和 **豆瓣** 的收藏数据，把封面压缩成 AVIF 走 CDN，再通过 Cloudflare Worker 提供给前端。数据同步是**事务化**的——全部分类成功才更新仓库，失败自动回滚，绝不让线上数据变成半成品。

## 背景：为什么需要这么一套东西

我的博客有一个「观阅计划」页面，用来展示看过的动画、读过的书、玩过的游戏和看过的电影。但有两个问题：

1. **数据源分裂**：动画和游戏我主要用 Bangumi 记录，书和电影主要在豆瓣标记，两个平台的收藏没法互通；
2. **访问不稳定**：Bangumi 的 API 在国内直连经常超时，豆瓣又没有公开的官方 API。

所以我做了一个独立的数据仓库，把两边（外加手动添加的条目）的收藏**合并成一份统一格式的数据**，再提供给博客页面展示。整套架构长这样：

```
┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│  Bangumi API │   │ 豆瓣 Frodo  │   │ custom/*.json │
└──────┬──────┘   └──────┬──────┘   └──────┬───────┘
       │                 │                 │
       └─────────┬───────┴─────────────────┘
                 ▼
        ┌──────────────────┐
        │   GitHub Actions  │ 每 3 小时 + 手动 + push
        │   scripts/sync.js │
        └────────┬─────────┘
                 ▼
        ┌──────────────────┐   封面转 AVIF
        │  data/*.json      │──▶ images/*.avif
        │  （统一格式）       │        │
        └────────┬─────────┘   │ 同源 /images/ 代理
                 ▼                   ▼
        ┌──────────────────────────────────┐
        │  Cloudflare Worker（data.201562.xyz）│
        └────────────────┬─────────────────┘
                         ▼
                 博客「观阅计划」页面
```

简单说就是三件事：**同步**（GitHub Actions 拉数据）、**托管**（GitHub 仓库存 JSON + 封面图）、**投喂**（Worker 把数据变成博客能用的 API）。

## 数据从哪来

### Bangumi：官方 API 分页拉取

Bangumi 官方提供 `/v0/users/{username}/collections` 接口，按 `subject_type` 分类（1 书籍 / 2 动画 / 3 音乐 / 4 游戏 / 6 三次元），每页 50 条循环翻页：

```js
async function fetchAll(username, subjectType) {
	const all = [];
	let offset = 0;
	while (true) {
		const url = `${API_URL}/v0/users/${username}/collections?subject_type=${subjectType}&limit=50&offset=${offset}`;
		const resp = await fetch(url, { headers: { Accept: "application/json" } });
		const data = await resp.json();
		const batch = data.data || [];
		all.push(...batch);
		if (batch.length < 50) break; // 一页不满说明拉完了
		offset += 50;
	}
	return all;
}
```

### 豆瓣：逆向 App 内部接口（Frodo API）

豆瓣没有公开 API，但它的 App 内部接口是公开可抓的。核心难点是**签名**：每个请求要带 `apiKey`、时间戳 `_ts` 和 `_sig`，其中 `_sig` 是 `HMAC-SHA1` 对 `"GET&" + URL编码的路径 + "&" + 时间戳` 计算出的 Base64 字符串，密钥是 App 内置的（所有用户共用，不涉及个人账号）：

```js
function doubanSignature(apiPath, ts) {
	const encodedPath = encodeURIComponent(apiPath).replace(/[!'()*]/g, (c) =>
		"%" + c.charCodeAt(0).toString(16).toUpperCase(),
	);
	const raw = ["GET", encodedPath, ts].join("&");
	return createHmac("sha1", DOUBAN_SECRET).update(raw).digest("base64");
}
```

请求 `/api/v2/user/{id}/interests`，按类型（book/movie/music/game）和收藏状态（done/doing/mark）分别拉取，和 Bangumi 的「看过/在看/想看」一一对应。豆瓣条目 ID 会加一个 `10_000_000_000` 的命名空间，避免和 Bangumi ID 撞车；评分是 5 星制，乘以 2 转成 Bangumi 的 10 分制；跳转链接保留豆瓣原始条目页。

### 手动条目：custom 目录

总有一些条目不在任何平台的收藏里，所以脚本还支持从 `custom/{分类}.json` 手动添加（`custom: true` 标记），封面给远程链接也会自动下载处理。

## 封面：下载 → AVIF → 同源代理

收藏数据里的封面 URL 都是大图，直接让博客去拉体验很差。同步脚本会做三件事：

1. **下载**封面原图；
2. 用 `sharp` 压成 **AVIF**（宽 400px、质量 50，卡片展示完全够用，体积能小 70% 以上）；
3. 存到仓库 `images/{分类}/{id}.avif`，Worker 返回数据时把相对路径拼成**同源 `/images/...` 地址**（如 `https://data.201562.xyz/images/anime/123.avif`），图片由 Worker 代理回源并带边缘缓存。

这里踩了不少坑，最有代表性的是豆瓣图床（doubanio）的防盗链和海外访问问题：

- **无 Referer 会被拒**：下载时依次尝试「无 Referer → 豆瓣分享链接 → 条目页 → 豆瓣首页」多组请求头；
- **海外服务器会断连**：GitHub Actions 跑在美国，连豆瓣图床经常 `fetch failed`（网络层断连，不是 HTTP 错误）。一开始脚本只试两次就放弃，导致偶尔有几张封面没下载成功、数据里残留豆瓣原链接。

后来把下载逻辑加固成：**20s 超时 + 指数退避最多重试 4 次 + 多 Referer 候选**，并给豆瓣封面下载之间加了间隔。加固后再跑就再没出现过漏图。

## 数据安全：事务化同步

这是我认为最值得分享的设计。同步脚本会访问 5 个分类 × 多个 API，任何一个环节出问题（豆瓣限流、Bangumi 超时、网络抖动），都可能让仓库数据变成「更新一半」的状态。所以脚本做成了**全有或全无**：

1. 所有分类先同步到**内存**，封面先下载到 `images/.staging/` 暂存区；
2. **全部分类都成功**，才清空旧封面、移入新封面、统一写入 `data/*.json`（写入用临时文件 + 重命名，避免写一半损坏）；
3. **任何一个分类失败**，立即回滚：删除暂存区，旧数据和旧封面原封不动，脚本以非零退出码退出，GitHub Actions 显示红色 ❌ 但**不会产生任何提交**。

```js
// 事务化：先全量同步到内存，任何一个分类失败就回滚
const results = {};
try {
	for (const cat of CATEGORIES) {
		results[cat.key] = await syncCategory(cat);
	}
} catch (e) {
	console.error(`❌ 同步失败：${e.message}`);
	rmSync(IMAGES_STAGING, { recursive: true, force: true });
	process.exit(1); // 不写数据、不动旧封面
}

finalizeImages(); // 全部成功：先落封面
for (const cat of CATEGORIES) writeDataFile(cat.key, results[cat.key]); // 再统一写数据
```

配套的还有两点：GitHub Actions 的提交步骤只 `git add data images`（不 `git add -A`，防止把无关文件一起提交）；数据 JSON 先写 `.tmp` 再重命名，进程意外被杀也不会留下损坏文件。

## Worker：把仓库变成 API

数据同步好之后，博客怎么读？我在 Cloudflare 上部署了一个 Worker（绑定自定义域名 `data.201562.xyz`），它做的事情很纯粹：

- 接收博客的 `GET /v0/users/{username}/collections?subject_type=X` 请求；
- 从 `raw.githubusercontent.com` 拉取对应的 `data/{分类}.json`（始终与仓库同步，不依赖第三方 CDN）；
- 把 `images/...` 相对路径改写成同源 `/images/...` 完整地址，图片同样由 Worker 代理回源；
- 返回带 **CORS** 头（浏览器跨域需要）的 JSON；数据缓存 5 分钟、图片缓存 1 天（`?refresh=1` 可强制回源）。

博客端「观阅计划」页面用的是动态模式，每次打开页面实时请求 Worker，所以数据同步完刷新页面就能看到最新收藏，完全不需要重新构建博客。

## 日常维护

- **每 3 小时**自动同步一次，**每次 push 到 main** 也会触发（改动手动条目后立刻生效）；
- 删除收藏后想立刻更新：GitHub Actions → **Sync Bangumi Data** → **Run workflow** 手动触发，5 分钟内页面可见；
- 所有频率都可用环境变量控制：豆瓣翻页间隔 `DOUBAN_PAGE_DELAY_MS`、分类间隔 `DOUBAN_CATEGORY_DELAY_MS`、封面下载间隔 `DOUBAN_IMAGE_DELAY_MS`；
- 同步失败时仓库保持原样，Actions 红点提醒我处理，线上数据永远可用。

## 小结

这套管线最值得抄的其实是三个点：

1. **逆向来的接口也要按正常 API 对待**——签名、分页、状态映射，缺一不可；
2. **图片要做体积优化**——AVIF + 适当尺寸 + 边缘缓存，比原图直链体验好太多；
3. **同步任务一定要事务化**——宁可失败不动，也不要更新一半，数据一致性比「及时」更重要。

如果你也在折腾自己的收藏展示页，希望这篇能帮你少踩几个坑。
