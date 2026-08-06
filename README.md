# 我的博客

基于 [Astro](https://astro.build/) 构建的个人博客，使用 Markdown / MDX 写作。

## 功能特性

- 左右侧边栏、文章列表 / 卡片 / 瀑布流布局
- 站内全文搜索（Pagefind）、RSS 订阅、站点地图
- 主题色自定义、亮 / 暗 / 跟随系统模式
- 评论系统（Twikoo / Waline / Giscus / Artalk 可选）
- 友链、赞助、相册、追番、留言板等扩展页面

## 常用命令

```sh
pnpm dev        # 启动开发服务器
pnpm build      # 构建生产站点到 dist/
pnpm preview    # 本地预览构建产物
pnpm new-post   # 命令行新建文章
pnpm check      # 类型检查
```

## 写文章

在 `src/content/posts/` 下新建 `.md` 或 `.mdx` 文件：

```md
---
title: 文章标题
published: 2026-08-06
description: 文章简介
tags: [随笔]
category: 随笔
draft: false
---
```

## 站点配置

所有配置集中在 `src/config/` 目录：

- `siteConfig.ts`：站点标题、URL、主题色、导航
- `profileConfig.ts`：个人资料、头像、社交链接
- `commentConfig.ts`：评论系统
- `friendsConfig.ts`：友链

## 部署

构建产物在 `dist/`，可部署到任意静态托管平台（Vercel、Netlify、Cloudflare Pages、GitHub Pages 等）。
部署前记得把 `src/config/siteConfig.ts` 里的 `site_url` 改成正式域名。
