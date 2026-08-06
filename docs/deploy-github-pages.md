# GitHub Pages 部署教程

本项目已内置 `.github/workflows/deploy.yml`（使用 [JamesIves/github-pages-deploy-action](https://github.com/JamesIves/github-pages-deploy-action) 部署到 `pages` 分支）。

## 部署前准备

### 1. 修改站点地址

打开 `src/config/siteConfig.ts`，把 `site_url` 改为 GitHub Pages 地址：

- 项目页（仓库名不是 `<用户名>.github.io`）：
  ```ts
  site_url: "https://<用户名>.github.io/<仓库名>/",
  ```
- 用户页（仓库名必须是 `<用户名>.github.io`，只有这一个仓库时）：
  ```ts
  site_url: "https://<用户名>.github.io/",
  ```

### 2. 修改 base 路径（项目页必改）

GitHub Pages 项目页部署在子路径下（如 `/astro-theme-halcyon/`），需要修改 `astro.config.mjs`：

```js
base: "/<仓库名>/",   // 例如 "/astro-theme-halcyon/"
```

如果部署到用户页（`<用户名>.github.io` 根路径），保持 `base: "/"` 即可。

### 3. 确认 workflow 触发分支

`.github/workflows/deploy.yml` 中触发分支应改为你的默认分支（本项目是 `main`）：

```yaml
push:
  branches: [ main ]
```

---

## 部署步骤

1. 将以上改动提交并推送到 GitHub。
2. 打开仓库 **Settings → Pages**（或在 Actions 标签页看到 `Deploy to Pages Branch` 工作流运行）。
3. 在 **Build and deployment → Source** 选择 **Deploy from a branch**，分支选 `pages`，目录 `/ (root)`。
4. 回到 Actions 页面，手动触发一次 `Deploy to Pages Branch`（或直接推送代码触发）。
5. 等待工作流完成，访问 `https://<用户名>.github.io/<仓库名>/` 即可看到站点。

> 如果已经配置好 `pages` 分支，日常发布流程就是：`git push` 到 `main` → Actions 自动构建并更新 `pages` 分支 → GitHub Pages 自动更新。

## 自定义域名

1. 在仓库根目录 `public/` 下添加 `CNAME` 文件，内容为你的域名（如 `201562.xyz`），构建时会自动带到 `dist`。
2. 在 **Settings → Pages → Custom domain** 输入域名保存。
3. 在 DNS 服务商处添加 CNAME 记录指向 `<用户名>.github.io`。

## 常见问题

- **页面样式错乱 / 图片 404**：基本都是 `base` 没设置对。项目页必须把 `base` 改成 `/仓库名/`。
- **工作流没有运行**：检查 `deploy.yml` 的 `branches` 是否与你的默认分支一致（原文件写的是 `master`，本项目是 `main`）。
- **部署后是 404**：确认 Settings → Pages 的 Source 分支选择的是 `pages` 而不是 `main`。
- **首页能开但文章 404**：确认 `siteConfig.site_url` 末尾带 `/`，且与访问地址完全一致。
