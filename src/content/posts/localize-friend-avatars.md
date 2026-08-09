---
title: 友链头像本地化：让头像不再加载缓慢
published: 2026-08-09T15:00:00+08:00
pinned: false
description: 友链页面的头像都指向对方站点，加载慢还容易挂。把头像下载到本地、静态转 AVIF、动图原样保留，并写进构建流程自动同步的实践记录。
tags: [友链, 性能优化, Astro]
category: 教程
draft: false
image: /images/covers/localize-friend-avatars.avif
---

> 友链页面的头像本来都是直接引用对方站点的图片链接，访问慢不说，对方站点一挂头像就裂。这篇记录我把头像全部「本地化」的过程：下载到自己的仓库、静态图转 AVIF 压缩、动图原样保留，并且做成了 `npm run build` 自动执行的脚本。

## 问题：头像为什么慢

我的友链页面（`/friends/`）有 7 个友链，头像来源五花八门：

- 对方自建站点的 `logo.png`、`favicon.png`；
- GitHub 头像、QQ 头像接口；
- 还有一张 31 帧的**动态头像**。

这些图片全都走外部链接，有两个问题：

1. **加载慢**：每个头像都要请求一次对方站点，如果对方服务器慢、或者在大陆访问不佳，头像会半天出不来；
2. **不可控**：对方换图床、关站点，头像就变成裂图，我没法干预。

累计下来这些头像原图有 2MB+（最大的单张 789KB），对一个小博客来说负担不小。

## 方案：下载到本地

思路和封面图一样——**把头像下载到自己的仓库，构建时一起打包**，部署后全部走自己站点的 CDN：

- 静态头像：统一转成 **AVIF**（256×256，卡片展示绰绰有余），体积能压掉 90% 以上；
- 动态头像：**原样保留**不转换（下面会解释为什么）。

最终效果：6 张静态头像从约 1.7MB 压到合计 100KB 左右，动图保持原样，页面不再依赖任何外部站点。

## 实现：一个脚本搞定

我写了一个 `scripts/sync-friend-avatars.js`，做的事情很直接：

1. 读取 `src/config/friendsConfig.ts`，用正则提取所有远程 `imgurl`（自动跳过注释里的示例）；
2. 逐个下载头像；
3. 静态图用 `sharp` 转 AVIF 并裁剪成 256×256；
4. 动图原样保存（扩展名按真实格式）；
5. 把配置里的远程链接替换成本地路径 `/images/friends/xxx.avif`；
6. 清理目录里不再被引用的旧文件。

核心转换逻辑就一小段：

```js
const meta = await sharp(buf, { animated: true }).metadata();

if (meta.pages && meta.pages > 1) {
  // 动图（GIF/WebP）：原样保存，不做任何转换
  return buf;
}

const avif = await sharp(buf)
  .resize({ width: 256, height: 256, fit: "cover" })
  .avif({ quality: 75, effort: 6 })
  .toBuffer();
```

文件名用友链标题的 ASCII 部分生成（如 `Hyde Blog` → `hyde-blog.avif`），纯中文标题回退到域名，保证稳定且不会乱码。

## 踩到的坑

**「动态头像不能转 AVIF」**。一开始想全都转 AVIF，结果 `sharp` 对动态 AVIF 支持有限——31 帧的动图转出来只剩第一帧，动画没了。所以动图最终选择原样保存：GIF 保持 GIF，服务器返回的是动画 WebP 就保持 WebP，浏览器都能正常播放。

**「链接后缀不能信」**。友链里那张 `avatar.gif`，`curl` 一看响应头是 `image/gif`，但加 `Accept: image/*` 再请求，服务器直接返回了**动画 WebP**（31 帧）。所以判断格式不能看 URL 后缀，要读图片实际内容（`sharp` 的 `metadata`），扩展名按真实格式来。

**「转换不能盲信原图」**。有个头像原图 789KB 还是大图，转完 AVIF 只剩 14KB，肉眼完全看不出区别——因为头像展示尺寸只有 64px。

## 接入构建

只做一次还不够，以后加友链、换头像还得重复。所以我把脚本挂进了构建命令：

```json
{
  "scripts": {
    "build": "node scripts/auto-cover.js && node scripts/sync-friend-avatars.js && node scripts/generate-icons.js && ... && astro build && pagefind --site dist"
  }
}
```

脚本是**幂等**的：全部头像已经是本地路径时直接跳过，什么都不改；单个头像下载失败也不会中断构建，只是警告并保留原链接兜底。所以每次 `npm run build` 都会自动检查一遍，加新友链后构建一次就自动本地化了。

## 效果

- 友链页 7 个头像全部走 `/images/friends/`，不再依赖对方站点速度；
- 静态头像合计约 100KB（原图 1.7MB+）；
- 动态头像正常播放动画；
- 以后加友链：填上 `imgurl` 跑一次 `npm run build`，自动完成下载、压缩、改配置。

## 小结

头像本地化的本质，就是把「运行时依赖」变成「构建时依赖」：把不可控的外部资源，在构建时拉下来、压缩好、打包进自己的站点。这个思路同样适用于封面、图标、字体等任何静态资源——**能构建时解决的，就不要留给浏览器**。
