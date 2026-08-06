# Cloudflare 部署教程

本项目支持两种 Cloudflare 部署方式：**Cloudflare Pages**（图形化，推荐）和 **Cloudflare Workers**（CLI，项目已内置 `wrangler.jsonc`）。

## 部署前准备

修改 `src/config/siteConfig.ts` 中的 `site_url` 为正式域名：
```ts
site_url: "https://你的域名",
```

---

## 方式一：Cloudflare Pages（推荐，控制台操作）

1. 把项目推送到 GitHub。
2. 打开 [dash.cloudflare.com](https://dash.cloudflare.com) → 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
3. 授权 Cloudflare 访问仓库，选择本主题仓库。
4. 在构建设置中填写：
   - Framework preset: 选 `Astro`（如果没有就留空）
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - 需要时可以添加环境变量（一般不需要）
5. 点击 **Save and Deploy**，等待构建完成。
6. 完成后会得到 `xxx.pages.dev` 域名，每次 `git push` 到 `main` 自动部署。

### Pages 自定义域名

进入项目 → **Custom domains** → **Set up a custom domain**，输入域名后按提示在 DNS 服务商添加 CNAME 记录（指向 `xxx.pages.dev`），Cloudflare 会自动签发 HTTPS 证书。如果域名托管在 Cloudflare，选择 **Active Proxy**（橙色云朵）即可。

---

## 方式二：Cloudflare Workers（wrangler CLI）

项目根目录已内置 `wrangler.jsonc`（静态资源模式），本地即可部署。

1. 安装依赖并构建（注意需要 `CF_WORKERS=1` 环境变量启用 Cloudflare adapter）：
   ```sh
   pnpm install
   CF_WORKERS=1 pnpm build
   ```
2. 登录 Cloudflare（会打开浏览器授权）：
   ```sh
   npx wrangler login
   ```
   也可以在环境变量里设置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。
3. 部署：
   ```sh
   npx wrangler deploy
   ```
4. 部署完成后会输出 `xxx.workers.dev` 域名，可用 `npx wrangler deployments list` 查看历史版本。

### Workers 自定义域名

在 Cloudflare 控制台 **Workers & Pages** → 你的 Worker → **Settings → Domains & Routes** → **Add**，添加域名后按提示配置 DNS 即可。

> 提示：Cloudflare Workers 免费版每天有 10 万次请求额度，个人博客完全够用。纯静态站点建议用 Pages（方式一），更省心。

## 常见问题

- **`CF_WORKERS=1` 报错**：该变量只在 Workers 方式需要，Pages 方式不要加。
- **构建失败**：确认 Node 版本 ≥ 22（Pages 可以在构建设置里指定 Node 版本）。
- **wrangler 提示缺少 account id**：在项目目录创建 `.dev.vars` 或在环境变量中配置 `CLOUDFLARE_ACCOUNT_ID`。
