---
title: Cloudflare 代理任意网站教程
published: 2026-08-08T12:00:00+08:00
pinned: false
description: 用 Cloudflare Workers 写一个通用反向代理，代理任意网站、API 或图片资源，附完整 Worker 代码、缓存、CORS 与自定义域名配置。
tags: [Cloudflare, 教程, 代理]
category: 教程
draft: false
image: /images/covers/cloudflare-reverse-proxy.avif
---

> **合规提醒**：请先阅读 Cloudflare [服务条款](https://www.cloudflare.com/terms/)（Self-Serve Subscription Agreement 2.2.1），其中明确禁止「使用服务提供 VPN 或其他类似代理服务」。本文内容仅用于**合法场景**：自己 API 的跨域代理、静态资源加速、访问你拥有或已获授权的资源。**禁止**用于翻墙、绕过付费墙、抓取侵权内容、搭建公共梯子等用途，Cloudflare 会直接封号。免费套餐也禁止大量代理视频或不成比例的图片/音频/大文件。

## 原理

Cloudflare Workers 运行在 Cloudflare 全球边缘节点上，其中一个核心能力是 `fetch()`：Worker 收到请求后，可以**以子请求的形式**去请求任意公网 URL，再把响应返回给用户。这就是反向代理的最小模型：

```
用户 ──> 你的代理域名 ──> Worker ──> fetch() ──> 目标网站
用户 <────────────────────────────── 响应 <──── 目标网站
```

所以「代理任意网站」的本质只有三步：

1. Worker 收到请求，解析出路径和查询参数；
2. 把它们拼到目标站点地址上，用 `fetch()` 发起子请求；
3. 把目标站点的响应（可做 CORS、缓存、域名改写等处理）返回给用户。

## 完整 Worker 代码

下面是一份通用的单目标站点代理，目标地址用环境变量 `UPSTREAM_URL` 配置，改起来最方便：

```js
// worker.js
const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Access-Control-Max-Age": "86400",
};

/** 需要改写域名的响应类型（页面/接口/脚本里会硬编码目标域名） */
function isTextType(contentType = "") {
	return /html|json|javascript|xml|text\//i.test(contentType);
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const proxyOrigin = `${url.protocol}//${url.host}`;
		const upstream = env.UPSTREAM_URL; // 例如 https://example.com

		// CORS 预检请求直接返回
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		// 把请求的 path 和 query 拼到目标站点上
		const target = new URL(url.pathname + url.search, upstream);
		const upstreamReq = new Request(target, {
			method: request.method,
			headers: {
				Accept: request.headers.get("Accept") || "*/*",
				"User-Agent":
					request.headers.get("User-Agent") || "Mozilla/5.0 (CloudflareProxy/1.0)",
				...(request.headers.get("Authorization")
					? { Authorization: request.headers.get("Authorization") }
					: {}),
				...(request.headers.get("Cookie") ? { Cookie: request.headers.get("Cookie") } : {}),
			},
		});

		let resp;
		try {
			resp = await fetch(upstreamReq);
		} catch (_e) {
			return new Response("Upstream request failed", { status: 502, headers: CORS_HEADERS });
		}

		// 文本内容：把目标域名改写为代理域名，让页面内链接、图片、跳转都走代理
		const contentType = resp.headers.get("Content-Type") || "";
		let body = resp.body;
		if (isTextType(contentType)) {
			const text = await resp.text();
			body = new Blob([text.replaceAll(upstream, proxyOrigin)]);
		}

		const headers = new Headers(resp.headers);
		for (const [key, value] of Object.entries(CORS_HEADERS)) {
			headers.set(key, value);
		}
		return new Response(body, { status: resp.status, statusText: resp.statusText, headers });
	},
};
```

几个要点：

- `new URL(url.pathname + url.search, upstream)` 会把 `/foo?a=1` 拼到目标域名后，根路径访问时正好是 `upstream/`，目标站会正常重定向到首页。
- 只转发 `Authorization` 和 `Cookie`，避免把浏览器一堆无关头转发过去被目标站拦截。
- `replaceAll(upstream, proxyOrigin)` 会把响应文本里的 `https://example.com` 全部替换成你的代理域名，这样页面里的链接和图片都会自动走代理。
- 目标站有多个子域名（如 `api.example.com`、`cdn.example.com`）时，需要给 `replaceAll` 追加多条规则，参考我博客里 [Bangumi 代理](https://github.com/xingyue404/blog/tree/main/bangumi-proxy) 的实现。

## 部署（wrangler CLI）

1. 新建目录并创建 `wrangler.toml`：

   ```toml
   name = "my-proxy"
   main = "worker.js"
   compatibility_date = "2026-06-01"

   [vars]
   UPSTREAM_URL = "https://example.com"
   ```

2. 登录并部署：

   ```sh
   npx wrangler login
   npx wrangler deploy
   ```

3. 部署完成会输出 `xxx.workers.dev` 地址，直接访问：

   ```
   https://xxx.workers.dev/任意路径
   ```

   注意：`workers.dev` 域名只能用于开发测试，正式使用请绑定自定义域名（见下文，Cache API 也要求自定义域名）。

## 部署（控制台粘贴）

1. 打开 [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Worker**。
2. 删掉默认代码，粘贴上面的 `worker.js`，点击 **Deploy**。
3. 进入 **Settings → Variables**，添加变量 `UPSTREAM_URL`（值为目标站点，如 `https://example.com`），保存后重新部署一次。

## 自定义域名

进入 Worker → **Settings → Domains & Routes** → **Add**，输入你的域名（如 `proxy.example.com`），Cloudflare 会提示添加 CNAME 记录。域名托管在 Cloudflare 时选择 **Active Proxy**（橙色云朵）即可，HTTPS 证书自动签发。

之后访问方式变成：

```
https://proxy.example.com/任意路径
```

## 进阶：加缓存

Worker 的 `fetch()` 子请求不计入你自己的请求配额，但每次请求都会消耗 CPU 时间。用 [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/) 把响应缓存到边缘，能大幅降低回源次数：

```js
// 在 fetch 开头尝试命中缓存
const cacheKey = new Request(url.toString(), request);
const cached = await caches.default.match(cacheKey);
if (cached) return cached;

// 拿到响应后，把成功的 GET 响应写入缓存
const newResp = new Response(body, { status: resp.status, headers });
if (request.method === "GET" && resp.ok) {
	ctx.waitUntil(caches.default.put(cacheKey, newResp.clone()));
}
return newResp;
```

> **重要**：Cache API 只有绑定**自定义域名或路由**的 Worker 才能用；纯 `workers.dev` 域名调用 `caches.default` 会直接报错。

## 局限与注意事项

- **免费额度**：Workers 免费计划每天 10 万次请求（UTC 午夜重置），单次请求 CPU 时间 50ms，超出会返回错误 1027。大文件、视频、重计算接口很容易超限，请优先选择 `paid` 计划或用 Pages Functions 之外的方案。
- **`fetch()` 不能直接请求 IP 地址**，只能请求域名。
- **域名改写不完整**：JS 里动态拼接的 URL、302 跳转 Location、`<base>` 标签、WebSocket（`wss://`）地址，`replaceAll` 不一定能覆盖到，需要按目标站实际情况补规则。
- **目标站可能反爬**：Cloudflare 的出口 IP 可能被目标站屏蔽，或触发验证码；目标站返回的 Set-Cookie 需要额外处理才生效。
- **请求头保留**：默认只转发部分头，如目标站校验 `Referer` 或 `Origin`，需要手动追加。
- **合规**：再次强调，翻墙、绕过付费墙、无授权抓取、搭 VPN 都属于违反 Cloudflare 服务条款的行为，账号会被封，请仅用于合法用途。

## 常见改动速查

| 需求 | 改动 |
| --- | --- |
| 只代理 API，不想动页面 | 去掉 `isTextType` 里的域名改写，保留 CORS 即可 |
| 代理多个目标站（如 API + 图片 + 网页） | 按路径路由到不同上游，参考 bangumi-proxy 的多上游写法 |
| 页面有 `cdn.xxx.com` 子域名资源 | 给 `replaceAll` 追加 `cdn.xxx.com` 规则 |
| 给代理加访问控制 | 校验请求头里的自定义 Token，不合法直接返回 403 |
| 代理大文件/视频 | 免费计划不合适，改用 R2 存储或付费计划 |
| 需要 WebSocket | Workers 原生支持 WebSocket 转发（需要保留 Upgrade 头并做专门处理），普通 `fetch()` 不转发 |

## 小结

Cloudflare Workers 反代的完整链路是：**配置上游 → 转发请求 → 改写响应 → 绑定域名 → 按需加缓存**。建议先用 `workers.dev` 域名测试，确认页面、图片、接口都正常后再绑自定义域名，最后按流量情况决定要不要开缓存。只要守住合规底线，这个方案非常适合给自建 API、静态资源和合法授权的内容做加速和跨域。
