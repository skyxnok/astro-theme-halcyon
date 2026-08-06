# Halcyon

基于 [Astro](https://astro.build/) 构建的个人博客主题，使用 Markdown / MDX 写作，静态构建后可部署到任意平台。

## 声明与致谢

本项目（Halcyon）是个人博客主题，基于 [Firefly](https://github.com/CuteLeaf/Firefly) 二次开发；Firefly 又基于 [Fuwari](https://github.com/saicaca/fuwari) 二次开发。

在此感谢两位原作者 [saicaca](https://github.com/saicaca)（Fuwari）与 [CuteLeaf](https://github.com/CuteLeaf)（Firefly）的开源贡献。

本项目遵循 [MIT License](LICENSE)，`LICENSE` 中保留了原作者的版权声明。

## 功能特性

- 左右侧边栏、文章列表 / 卡片 / 瀑布流布局
- 站内全文搜索（Pagefind）、RSS 订阅、站点地图（Sitemap）
- 主题色自定义（色相）、亮 / 暗 / 跟随系统模式
- 评论系统（默认 Giscus，支持 Twikoo / Waline / Artalk / Disqus 可选）
- 友链、赞助、相册、追番、留言板、关于等扩展页面
- 文章增强：KaTeX 数学公式、Mermaid / PlantUML 图表、Expressive Code 代码块、Callouts 提示块、加密文章 / 加密内容、GitHub 卡片
- 背景壁纸（桌面 / 移动端）、横幅文字、樱花特效（可配置）
- 多语言支持（简体中文 / 繁体中文 / English / 日本語 / Русский）

## 环境要求

- Node.js 22.12+（Astro 7 要求）
- [pnpm](https://pnpm.io/)（项目通过 `only-allow` 强制使用 pnpm）

## 常用命令

```sh
pnpm install   # 安装依赖
pnpm dev       # 启动开发服务器（默认 http://localhost:4321）
pnpm build     # 构建生产站点到 dist/（含图标、LQIP、Pagefind 索引）
pnpm preview   # 本地预览构建产物
pnpm new-post -- <文件名>  # 新建文章（自动生成带 Frontmatter 的 md 文件）
pnpm check     # Astro 类型检查
pnpm type-check# tsc 严格类型检查
pnpm lint      # Biome 检查并自动修复
pnpm format    # Biome 格式化 src/
pnpm covers    # 为没有封面图的文章自动下载封面（构建时会自动执行）
pnpm icons     # 重新生成图标清单
pnpm lqips     # 重新生成图片 LQIP 占位数据
```

## 写文章

在 `src/content/posts/` 下新建 `.md` 或 `.mdx` 文件即可，Frontmatter 支持以下字段：

```md
---
title: 文章标题          # 必填
published: 2026-08-06    # 必填，发布日期
updated: 2026-08-07      # 可选，更新日期
description: 文章简介     # 可选，默认空
tags: [随笔]             # 可选，标签列表
category: 随笔           # 可选，分类
draft: false             # 可选，true 时草稿不发布
image: ""                # 可选，封面图
pinned: false            # 可选，置顶
password: ""             # 可选，加密文章密码
passwordHint: ""         # 可选，加密密码提示
comment: true            # 可选，是否允许评论
---
```

也可以运行 `pnpm new-post -- <文件名>` 快速生成文章文件。

> `pnpm build` 会自动检测没有设置 `image` 的文章，从随机图 API 下载一张封面到 `public/images/covers/`，并把路径写入 Frontmatter 的 `image` 字段。想更换封面时，删除该字段后重新构建即可。

## 站点配置

所有配置集中在 `src/config/` 目录（详见 [src/config/README.md](src/config/README.md)）：

| 文件 | 说明 |
|------|------|
| `siteConfig.ts` | 站点标题、URL、描述、主题色、页面宽度、扩展页面开关 |
| `profileConfig.ts` | 个人资料、头像、社交链接 |
| `backgroundWallpaper.ts` | 背景壁纸、横幅文字 |
| `commentConfig.ts` | 评论系统（Giscus / Twikoo / Waline / Artalk / Disqus） |
| `navBarConfig.ts` | 导航栏、链接预设、搜索配置 |
| `sidebarConfig.ts` | 侧边栏组件布局 |
| `footerConfig.ts` | 页脚内容与版权信息 |
| `friendsConfig.ts` | 友链 |
| `galleryConfig.ts` | 相册（图片放在 `public/gallery/` 对应目录） |
| `sponsorConfig.ts` | 赞助信息与收款码 |
| `fontConfig.ts` | 自定义字体 |
| `effectsConfig.ts` | 樱花特效 |
| `expressiveCodeConfig.ts` | 代码高亮主题与插件 |
| `coverImageConfig.ts` | 文章封面图、随机封面图 API |
| `plantumlConfig.ts` | PlantUML 图表渲染 |
| `licenseConfig.ts` | 站点许可证（CC 协议） |

## 部署

构建产物在 `dist/`，可部署到任意静态托管平台（Vercel、Netlify、Cloudflare Pages、GitHub Pages 等）。

部署前记得：

1. 修改 `src/config/siteConfig.ts` 中的 `site_url` 为正式域名
2. 更新 `public/favicon/` 下的站点图标

项目内置 `@astrojs/cloudflare` 适配器，如需部署到 Cloudflare Workers，构建时设置环境变量 `CF_WORKERS=1` 即可。
