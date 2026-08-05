# 我的博客

基于 [Astro](https://astro.build/) 构建的个人博客，使用 Markdown / MDX 写作。

## 功能特性

- 极简风格，Lighthouse 满分表现
- SEO 友好：canonical URL 与 Open Graph
- 站点地图（sitemap）与 RSS 订阅
- Markdown & MDX 内容集合

## 项目结构

```text
├── public/              # 静态资源
├── src/
│   ├── assets/          # 图片等资源
│   ├── components/      # 组件（Header、Footer 等）
│   ├── content/blog/    # 博客文章（.md / .mdx）
│   ├── layouts/         # 页面布局
│   └── pages/           # 页面路由
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 写文章

在 `src/content/blog/` 下新建 `.md` 或 `.mdx` 文件，并在 frontmatter 中填写标题和日期即可，例如：

```md
---
title: '我的第一篇文章'
description: '文章简介'
pubDate: '2026-08-06'
---
```

## 常用命令

| 命令                   | 作用                                     |
| :--------------------- | :--------------------------------------- |
| `npm run dev`          | 启动本地开发服务器（`localhost:4321`）   |
| `npm run build`        | 构建生产站点到 `./dist/`                 |
| `npm run preview`      | 本地预览构建产物                         |
| `npm run astro --help` | 查看 Astro CLI 帮助                      |

## 部署前记得

- 在 `astro.config.mjs` 中把 `site` 改成你的正式域名
- 在 `src/consts.ts` 中修改站点标题和描述
- 在 `src/pages/about.astro` 中完善关于页
