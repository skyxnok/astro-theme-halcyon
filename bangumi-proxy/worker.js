/**
 * Bangumi 全家桶代理 Worker
 * 统一代理 API（api.bgm.tv）、详情页网页（bgm.tv）与图片（lain.bgm.tv），
 * 并改写响应中的 bgm.tv 域名为当前代理域名，让页面跳转和图片都走代理。
 * 部署后把 src/config/siteConfig.ts 中 bangumi.apiUrl / subjectBaseUrl 改为本 Worker 地址。
 */
const UPSTREAM_API = "https://api.bgm.tv";
const UPSTREAM_WEB = "https://bgm.tv";
const UPSTREAM_IMAGE = "https://lain.bgm.tv";

// GET 响应缓存时长（秒）
const CACHE_TTL = 300;

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
	"Access-Control-Allow-Headers": "Accept, Authorization, Content-Type, User-Agent",
	"Access-Control-Max-Age": "86400",
};

/** 根据路径选择上游：/v0 /v2 /v3 /api -> API；/pic /r -> 图片；其余 -> 网页 */
function getUpstream(pathname) {
	if (/^\/v[0-9]\//.test(pathname) || pathname.startsWith("/api/")) return UPSTREAM_API;
	if (pathname.startsWith("/pic/") || pathname.startsWith("/r/")) return UPSTREAM_IMAGE;
	return UPSTREAM_WEB;
}

/** 把响应里的 bgm.tv 域名改写为代理域名（文本内容适用） */
function rewriteBody(body, proxyOrigin) {
	return body
		.replaceAll("https://bgm.tv", proxyOrigin)
		.replaceAll("http://bgm.tv", proxyOrigin)
		.replaceAll("https://api.bgm.tv", proxyOrigin)
		.replaceAll("http://api.bgm.tv", proxyOrigin)
		.replaceAll("https://lain.bgm.tv", proxyOrigin)
		.replaceAll("http://lain.bgm.tv", proxyOrigin)
		.replaceAll("https://image.bgm.tv", proxyOrigin)
		.replaceAll("http://image.bgm.tv", proxyOrigin);
}

function isTextType(contentType = "") {
	return /html|json|javascript|xml|text\//i.test(contentType);
}

function corsResponse(response, extraHeaders = {}) {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries({ ...CORS_HEADERS, ...extraHeaders })) {
		headers.set(key, value);
	}
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
	async fetch(request, _env, ctx) {
		const url = new URL(request.url);
		const proxyOrigin = `${url.protocol}//${url.host}`;

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
		}

		// 带 Authorization / Cookie 的请求不缓存（内容与用户相关）
		const hasAuth = Boolean(request.headers.get("Authorization") || request.headers.get("Cookie"));
		const cache = caches.default;
		const cacheKey = new Request(url.toString(), request);

		if (request.method === "GET" && !hasAuth) {
			const cached = await cache.match(cacheKey);
			if (cached) return corsResponse(cached);
		}

		const upstream = getUpstream(url.pathname);
		const upstreamReq = new Request(upstream + url.pathname + url.search, {
			method: request.method,
			headers: {
				Accept: request.headers.get("Accept") || "*/*",
				"User-Agent":
					request.headers.get("User-Agent") || "Mozilla/5.0 (compatible; BangumiProxy/1.0)",
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

		const contentType = resp.headers.get("Content-Type") || "";
		let outBody = resp.body;

		// 文本内容：改写域名，让页面内链接和图片 URL 都走代理
		if (isTextType(contentType) && resp.ok) {
			const text = await resp.text();
			const rewritten = rewriteBody(text, proxyOrigin);
			outBody = new Blob([rewritten]);
		}

		const newResp = corsResponse(
			new Response(outBody, { status: resp.status, statusText: resp.statusText }),
			{ "Cache-Control": `public, max-age=${CACHE_TTL}` },
		);

		// 缓存成功的 GET 响应
		if (request.method === "GET" && resp.ok && !hasAuth) {
			ctx.waitUntil(cache.put(cacheKey, newResp.clone()));
		}

		return newResp;
	},
};
