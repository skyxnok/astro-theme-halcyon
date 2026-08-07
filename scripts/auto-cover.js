/**
 * 封面图自动下载脚本
 * 构建时扫描没有设置 image 字段的文章，从随机图 API 下载图片到本地，
 * 并把本地路径写入文章 Frontmatter 的 image 字段。
 *
 * 使用方法：node scripts/auto-cover.js
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const POSTS_DIR = join(ROOT_DIR, "src", "content", "posts");
const COVERS_DIR = join(ROOT_DIR, "public", "images", "covers");

// 随机图 API：返回 JSON，如 { "url": "https://pic.201562.xyz/background/xxx.jpg" }
const API_URL = "https://pic.201562.xyz/random?folder=background";
const API_RETRY = 3;
const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// 封面图统一转 AVIF：限制宽度并压缩，体积更小、加载更快
const AVIF_MAX_WIDTH = 1600;
const AVIF_QUALITY = 55;

/** 把图片 Buffer 转换为 AVIF 格式 */
async function toAvif(buf) {
	return sharp(buf)
		.resize({ width: AVIF_MAX_WIDTH, withoutEnlargement: true })
		.avif({ quality: AVIF_QUALITY, effort: 4 })
		.toBuffer();
}

/** 解析 Frontmatter，返回字段行数组和结束行索引 */
function parseFrontmatter(content) {
	const lines = content.split("\n");
	if (lines[0].trim() !== "---") return null;
	let end = -1;
	for (let i = 1; i < lines.length; i++) {
		if (lines[i].trim() === "---") {
			end = i;
			break;
		}
	}
	if (end === -1) return null;
	return { fields: lines.slice(1, end), endIndex: end };
}

/** 读取 Frontmatter 中的某个字段值 */
function getField(fields, name) {
	const re = new RegExp(`^${name}\\s*:\\s*(.*)$`);
	for (const line of fields) {
		const m = line.match(re);
		if (m) return m[1].trim();
	}
	return undefined;
}

/** 从 API 下载一张随机图片，返回 { buf, ext } */
async function fetchRandomImage() {
	for (let attempt = 1; attempt <= API_RETRY; attempt++) {
		try {
			const res = await fetch(API_URL, { headers: { "User-Agent": USER_AGENT } });
			if (!res.ok) continue;
			const data = await res.json();
			const imgUrl = data && data.url;
			if (!imgUrl) continue;

			const imgRes = await fetch(imgUrl, { headers: { "User-Agent": USER_AGENT } });
			if (!imgRes.ok) continue;

			const buf = Buffer.from(await imgRes.arrayBuffer());
			if (buf.length === 0) continue;

			let ext = extname(new URL(imgUrl).pathname).toLowerCase();
			if (!ext) ext = ".jpg";
			return { buf, ext };
		} catch (_e) {
			// 重试
		}
	}
	throw new Error(`随机图 API 请求失败：${API_URL}`);
}

/** 在 Frontmatter 中插入 image 字段（放在结束的 --- 之前） */
function addImageField(content, frontmatter, imagePath) {
	const lines = content.split("\n");
	lines.splice(frontmatter.endIndex, 0, `image: ${imagePath}`);
	return lines.join("\n");
}

async function main() {
	const files = readdirSync(POSTS_DIR).filter((f) => /\.(md|mdx)$/.test(f));
	let updated = 0;

	for (const file of files) {
		const filePath = join(POSTS_DIR, file);
		const content = readFileSync(filePath, "utf8");
		const fm = parseFrontmatter(content);
		if (!fm) {
			console.log(`跳过 ${file}：缺少 Frontmatter`);
			continue;
		}

		const image = getField(fm.fields, "image");
		if (image && image !== '""' && image !== "''") {
			console.log(`跳过 ${file}：已设置封面 ${image}`);
			continue;
		}

		if (getField(fm.fields, "draft") === "true") {
			console.log(`跳过 ${file}：草稿`);
			continue;
		}

		const { buf } = await fetchRandomImage();
		const slug = file.replace(/\.(md|mdx)$/, "").replace(/[^\w.-]+/g, "-");
		const avifBuf = await toAvif(buf);
		const saveName = `${slug}.avif`;
		const imagePath = `/images/covers/${saveName}`;

		mkdirSync(COVERS_DIR, { recursive: true });
		writeFileSync(join(COVERS_DIR, saveName), avifBuf);
		writeFileSync(filePath, addImageField(content, fm, imagePath));

		console.log(`已为 ${file} 下载封面 -> ${imagePath}`);
		updated++;
	}

	if (updated === 0) {
		console.log("没有需要处理的文章（均已设置封面）");
	} else {
		console.log(`完成：共处理 ${updated} 篇文章`);
	}
}

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
