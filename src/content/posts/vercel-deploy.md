---
title: 博客部署教程（一）：Vercel
published: 2026-08-07
pinned: false
description: 我的博客主题 Halcyon 使用 Vercel 部署的完整教程，从导入仓库到自定义域名。
tags: [部署, 教程]
category: 教程
draft: false
image: /images/covers/vercel-deploy.avif
---

我的博客主题 Halcyon 用 Vercel 部署最简单：仓库推送到 GitHub 后，在 Vercel 导入即可自动构建，项目里已经内置了 `vercel.json`，不需要额外配置。

## 部署前准备

1. 把项目推送到 GitHub（先创建仓库，如 `skyxnok/astro-theme-halcyon`）。
2. 修改 `src/config/siteConfig.ts` 中的 `site_url` 为正式域名：
   ```ts
   site_url: "https://你的域名",
   ```

## 部署步骤

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录。
2. 点击 **Add New Project** → **Import Git Repository**。
3. 授权 Vercel 访问你的仓库，选择博客仓库，点击 **Import**。
4. Vercel 会自动识别框架为 **Astro**（`vercel.json` 已配置好）：
   - Framework Preset: `Astro`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
5. 点击 **Deploy**，等待构建完成。
6. 部署完成后会分配一个 `xxx.vercel.app` 域名，之后每次 `git push` 到 `main` 都会自动重新部署。

## 自定义域名

1. 进入项目 **Settings → Domains**。
2. 输入你的域名（如 `201562.xyz`），按提示在 DNS 服务商处添加记录：
   - 主域名：CNAME 到 `cname.vercel-dns.com`（或按 Vercel 提示）
   - 子域名：CNAME 到你的 `xxx.vercel.app`
3. 添加后 Vercel 会自动签发 HTTPS 证书。

## 常见问题

- **构建失败**：确认仓库根目录有 `pnpm-lock.yaml`，Vercel 会使用 `packageManager` 指定的 `pnpm@9.14.4`。
- **图片不显示**：确认 `site_url` 已改为正式域名，重新构建。
- **封面图下载失败**：`pnpm build` 会调用 `scripts/auto-cover.js` 从随机图 API 下载封面，确保构建环境能访问外网（Vercel 默认可以）。
- **部署后 404**：检查 `outputDirectory` 是否为 `dist`，且没有把 `astro.config.mjs` 的 `output` 改成 `server`。
