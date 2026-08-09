/**
 * 友链头像本地化脚本
 * 读取 src/config/friendsConfig.ts 里的友链头像链接，
 * 下载到 public/images/friends/ 并转成 AVIF（动图保持 GIF），
 * 然后把配置里的 imgurl 改写成本地路径，避免页面加载外部头像变慢。
 *
 * 用法：node scripts/sync-friend-avatars.js
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONFIG = join(ROOT, "src/config/friendsConfig.ts");
const OUT_DIR = join(ROOT, "public/images/friends");

const AVATAR_SIZE = 256; // 友链头像卡片 64px，256px 足够
const AVIF_QUALITY = 75;
const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/** title 转文件名：优先 ASCII 部分（如 "Hyde Blog" -> hyde-blog），纯中文回退到域名 */
function slugify(title, url) {
	const ascii = title
		.replace(/[^\x00-\x7F]/g, "")
		.replace(/[^A-Za-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
	if (ascii) return ascii;
	try {
		return new URL(url).hostname.replace(/^www\./, "").replace(/\./g, "-");
	} catch {
		return "friend";
	}
}

/** 下载远程头像并本地化，返回本地路径 */
async function localizeAvatar(url) {
	const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "image/*" } });
	if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
	const buf = Buffer.from(await resp.arrayBuffer());
	const meta = await sharp(buf, { animated: true }).metadata();

	if (meta.pages && meta.pages > 1) {
		// 动图（GIF/WebP）：原样保存，不做任何转换，只换扩展名
		return buf;
	}

	const avif = await sharp(buf)
		.resize({ width: AVATAR_SIZE, height: AVATAR_SIZE, fit: "cover" })
		.avif({ quality: AVIF_QUALITY, effort: 6 })
		.toBuffer();
	return avif;
}

mkdirSync(OUT_DIR, { recursive: true });

// 去掉注释行后提取所有 imgurl（含多行写法），在原文中做替换
const src = readFileSync(CONFIG, "utf8");
const noComments = src.replace(/^\s*\/\/.*$/gm, "");
const imgurlRe = /imgurl:\s*(["'])([^"']+)\1/g;
const titleRe = /title:\s*"([^"]+)"/g;

// 收集 title 位置（title 恒在 imgurl 之前），用于生成文件名
const titles = [];
let tm;
while ((tm = titleRe.exec(noComments)) !== null) {
	titles.push({ pos: tm.index, title: tm[1] });
}

const jobs = [];
let m;
while ((m = imgurlRe.exec(noComments)) !== null) {
	const url = m[2];
	if (/^https?:\/\//.test(url) && !url.includes("201562.xyz")) {
		const prev = titles.filter((t) => t.pos < m.index).pop();
		jobs.push({ url, title: prev ? prev.title : url });
	}
}

if (jobs.length === 0) {
	console.log("没有需要本地化的远程头像");
	process.exit(0);
}

let replaced = src;
const localPaths = [];
for (const { url, title } of jobs) {
	try {
		const buf = await localizeAvatar(url);
		const meta = await sharp(buf, { animated: true }).metadata();
		const ext = meta.pages && meta.pages > 1
			? meta.format === "webp" ? "webp" : "gif"
			: "avif";
		const file = `${slugify(title, url)}.${ext}`;
		const outPath = join(OUT_DIR, file);
		writeFileSync(outPath, buf);
		const localPath = `/images/friends/${file}`;
		replaced = replaced.replaceAll(url, localPath);
		localPaths.push(localPath);
		console.log(`✅ ${title} -> ${localPath} (${Math.round(buf.length / 1024)}KB)`);
	} catch (e) {
		console.warn(`⚠️ 下载失败，保留原链接: ${e.message}`);
	}
}

// 配置里已经引用的本地头像路径（清理时必须保留）
const localRefs = new Set(
	[...noComments.matchAll(/imgurl:\s*(["'])(\/images\/friends\/[^"']+)\1/g)].map(
		(m) => m[2],
	),
);

// 清理不再被引用的旧头像文件：只删「既不是本次新下载、配置里也不再引用」的文件
if (existsSync(OUT_DIR)) {
	for (const f of readdirSync(OUT_DIR)) {
		const p = `/images/friends/${f}`;
		if (!localPaths.includes(p) && !localRefs.has(p)) {
			rmSync(join(OUT_DIR, f), { force: true });
			console.log(`🗑️ 清理未引用文件: ${f}`);
		}
	}
}

if (replaced !== src) {
	writeFileSync(CONFIG, replaced);
	console.log("\n✅ friendsConfig.ts 已更新为本地头像");
} else {
	console.log("\n没有配置变更");
}
