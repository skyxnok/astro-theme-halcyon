---
title: Mac 微信双开教程
published: 2026-08-07
pinned: false
description: 在 Mac 上双开微信的完整方法：复制应用、修改 Bundle ID、重新签名，附自签名证书方案与常见问题。
tags: [Mac, 微信, 教程]
category: 教程
draft: false
image: /images/covers/mac-wechat-dual-open.avif
---

macOS 的微信默认只能同时运行一个实例。要实现双开，思路是：**复制一份微信应用，修改它的 Bundle ID，让系统把它当成一个独立的 App**，再重新签名使其可以正常启动。

## 适用环境

- macOS（以下步骤在 Sonoma / Sequoia 上验证通过）
- 微信 Mac 版（[官网下载](https://mac.weixin.qq.com/)）

## 原理简述

macOS 通过 App 的 `CFBundleIdentifier`（Bundle ID）来区分应用，同一 Bundle ID 的 App 只能打开一个实例。复制一份微信并修改 Bundle ID 后，系统会认为它是另一个应用，从而可以同时登录两个微信账号（主号 + 小号）。

## 操作步骤

### 1. 复制微信应用

打开「终端」，执行（会提示输入管理员密码）：

```bash
sudo cp -R /Applications/WeChat.app /Applications/WeChat2.app
```

### 2. 修改 Bundle ID

```bash
sudo /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.tencent.xinWeChat2" /Applications/WeChat2.app/Contents/Info.plist
```

### 3. 查看可用的签名身份

```bash
security find-identity -v -p codesigning
```

如果输出类似下面的内容，说明你有开发者证书：

```
  1) A1B2C3D4E5F67890ABCDEF1234567890ABCDEF12  "Apple Development: 你的名字 (XXXXXX)"
  2) FEDCBA0987654321FEDCBA0987654321FEDCBA09  "Mac Developer: 你的名字 (XXXXXX)"
  3) 0987654321ABCDEF0987654321ABCDEF09876543  "Developer ID Application: 你的名字 (XXXXXX)"
     3 valid identities found
```

复制任意一行**引号内的完整字符串**（例如 `Apple Development: 你的名字 (XXXXXX)`），它就是你的签名身份。

如果输出 `0 valid identities found`，说明没有开发者证书，请跳到下文「没有开发者证书怎么办（自签名）」一节。

### 4. 重新签名

把「你的签名身份」替换为第 3 步复制的字符串：

```bash
sudo codesign --force --deep --sign "你的签名身份" /Applications/WeChat2.app
```

示例：

```bash
sudo codesign --force --deep --sign "Apple Development: 你的名字 (XXXXXX)" /Applications/WeChat2.app
```

> `--sign` 后面必须是真实的证书名称，不能随便填。`--force` 表示覆盖原有签名，`--deep` 表示对应用内嵌套内容一并签名。

### 5. 移除隔离属性（推荐）

从网上下载的应用会带有隔离标记，可能导致打开时提示「无法验证开发者」或「已损坏」：

```bash
sudo xattr -dr com.apple.quarantine /Applications/WeChat2.app
```

### 6. 打开第二个微信

```bash
open /Applications/WeChat2.app
```

首次打开会要求登录，用第二个微信账号扫码即可，两个微信从此可以同时运行。

## 没有开发者证书怎么办（自签名）

如果没有 Apple 开发者账号，可以创建**自签名证书**来完成签名。系统会提示「未受信任」，但不影响使用。

### 1. 打开「钥匙串访问」

`启动台 → 其他 → 钥匙串访问`，或按 `Command + 空格` 搜索「钥匙串访问」。

### 2. 创建自签名证书

菜单栏 → `证书助理 → 创建证书`：

- **名称**：随意填写，例如 `WeChatDoubleOpen`（记住这个名字，后面签名要用）
- **身份类型**：自签名根证书
- **证书类型**：代码签名
- 其他选项保持默认

![创建证书-基本信息](/images/mac-wechat-dual-open/02-创建证书基本信息.png)

后续按默认值继续即可：

![证书有效期](/images/mac-wechat-dual-open/03-证书有效期.png)

![证书名称信息](/images/mac-wechat-dual-open/04-证书名称信息.png)

![选择钥匙串](/images/mac-wechat-dual-open/05-选择钥匙串.png)

### 3. 信任该证书

在钥匙串列表中找到刚创建的证书，右键 → `显示简介` → 展开「信任」→ 把「代码签名」改为「始终信任」。

![钥匙串证书列表](/images/mac-wechat-dual-open/01-钥匙串证书列表.png)

### 4. 用自签名证书重新签名

证书名称要和创建时填写的一致：

```bash
sudo codesign --force --deep --sign "WeChatDoubleOpen" /Applications/WeChat2.app
```

### 5. 移除隔离属性并打开

```bash
sudo xattr -dr com.apple.quarantine /Applications/WeChat2.app
open /Applications/WeChat2.app
```

## 常见问题

**Q1：打开提示「无法验证开发者」或「已损坏，请移到废纸篓」**

删除隔离属性即可：

```bash
sudo xattr -dr com.apple.quarantine /Applications/WeChat2.app
```

**Q2：签名时报错 `code object is not signed at all`**

确认 `--sign` 后面填的是真实存在的证书名称；自签名证书需要先在「钥匙串访问」里把「代码签名」信任级别改为「始终信任」。

**Q3：自签名证书加 `--options runtime` 签名失败**

自签名证书不支持 hardened runtime，去掉 `--options runtime` 参数即可。

**Q4：两个微信可以登录同一个账号吗？**

不能。两个实例需要分别登录两个不同的微信账号。

**Q5：微信更新后第二个微信还能用吗？**

`WeChat2.app` 是独立副本，不受原版更新影响；想用新版本时，重新执行一遍「复制 → 改 Bundle ID → 签名」即可。

## 一键脚本

保存为 `double-wechat.sh` 并执行，自动完成复制、改 ID、签名：

```bash
#!/bin/bash
# Mac 微信双开一键脚本
set -e

APP=/Applications/WeChat2.app

echo "==> 复制微信应用"
sudo cp -R /Applications/WeChat.app "$APP"

echo "==> 修改 Bundle ID"
sudo /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.tencent.xinWeChat2" "$APP/Contents/Info.plist"

IDENTITY=$(security find-identity -v -p codesigning | grep -oE '"[^"]+"' | head -1 | tr -d '"')
if [ -z "$IDENTITY" ]; then
  echo "未找到开发者证书，请先创建自签名证书（钥匙串访问 → 证书助理 → 创建证书）"
  exit 1
fi

echo "==> 使用证书 [$IDENTITY] 重新签名"
sudo codesign --force --deep --sign "$IDENTITY" "$APP"

echo "==> 移除隔离属性"
sudo xattr -dr com.apple.quarantine "$APP" || true

echo "完成！运行以下命令打开第二个微信："
echo "open $APP"
```

使用方式：

```bash
chmod +x double-wechat.sh
./double-wechat.sh
```
