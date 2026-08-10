import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

// 时长解析：支持 45（分钟）、"45m"、"1h30m"、"5h49m14s"，统一换算为秒
function parseDurationToSeconds(value: number | string): number {
	if (typeof value === "number") return Math.round(value * 60);
	const str = String(value).trim().toLowerCase();
	if (/^\d+(\.\d+)?$/.test(str)) return Math.round(parseFloat(str) * 60);
	const h = str.match(/(\d+(?:\.\d+)?)h/)?.[1];
	const m = str.match(/(\d+(?:\.\d+)?)m/)?.[1];
	const s = str.match(/(\d+(?:\.\d+)?)s/)?.[1];
	return Math.round(
		parseFloat(h ?? "0") * 3600 +
			parseFloat(m ?? "0") * 60 +
			parseFloat(s ?? "0"),
	);
}

const sportsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/sports" }),
	schema: z.object({
		date: z.date(),
		type: z.string(), // 运动项目：跑步 / 骑行 / 游泳 / 健身 ...
		duration: z.union([z.number(), z.string()]).optional().default(0).transform(parseDurationToSeconds), // 时长，内部为秒
		distance: z.number().optional().default(0), // 距离（公里）
		calories: z.number().optional().default(0), // 消耗（千卡）
	}),
});

const travelCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/travel" }),
	schema: z.object({
		date: z.date(), // 出发日期
		place: z.string(), // 地点 / 行程名
		days: z.number().optional().default(1), // 天数
	}),
});

const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
	schema: z.object({}),
});

export const collections = {
	posts: postsCollection,
	sports: sportsCollection,
	travel: travelCollection,
	spec: specCollection,
};
