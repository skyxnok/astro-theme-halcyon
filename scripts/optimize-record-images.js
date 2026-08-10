/**
 * 运动/旅行照片压缩脚本
 * 扫描 public/images/sports/ 与 public/images/travel/ 下的图片，
 * 静态图转为 AVIF（超过最大宽度的等比缩小），动图（GIF/WebP 动画）原样保留。
 *
 * 用法：node scripts/optimize-record-images.js
 */
import { readdirSync, statSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TARGET_DIRS = [
	join(ROOT, "public/images/sports"),
	join(ROOT, "public/images/travel"),
];

const AVIF_QUALITY = 75;
const AVIF_EFFORT = 6;
const MAX_WIDTH = 1920; // 超过此宽度的图片等比缩小
const CONVERT_RE = /\.(jpe?g|png|webp)$/i;

/** 递归收集需要转换的图片文件 */
function collectImages(dir) {
	const files = [];
	if (!existsSync(dir)) return files;
	const walk = (d) => {
		for (const f of readdirSync(d)) {
			const p = join(d, f);
			if (statSync(p).isDirectory()) walk(p);
			else if (CONVERT_RE.test(f)) files.push(p);
		}
	};
	walk(dir);
	return files;
}

let converted = 0;
let kept = 0;

for (const dir of TARGET_DIRS) {
	for (const file of collectImages(dir)) {
		const before = statSync(file).size;
		try {
			const meta = await sharp(file, { animated: true }).metadata();

			// 动图（GIF/WebP 动画）：原样保留
			if (meta.pages && meta.pages > 1) {
				console.log(`⏭️ 跳过动图: ${file.replace(ROOT, "")}`);
				kept++;
				continue;
			}

			const avifFile = file.replace(CONVERT_RE, ".avif");
			await sharp(file)
				.resize({ width: MAX_WIDTH, withoutEnlargement: true })
				.avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
				.toFile(avifFile);

			rmSync(file, { force: true });
			converted++;
			const after = statSync(avifFile).size;
			const saved = (((before - after) / before) * 100).toFixed(1);
			console.log(
				`✅ ${file.replace(ROOT, "")} -> .avif (${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB, 省 ${saved}%)`,
			);
		} catch (e) {
			console.warn(`⚠️ 转换失败，保留原图: ${file.replace(ROOT, "")} (${e.message})`);
		}
	}
}

console.log(`\n完成：转换 ${converted} 张，保留动图 ${kept} 张`);
