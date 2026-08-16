---
title: macOS 下 OpenEmu 安装与使用教程
published: 2026-08-16T10:00:00+08:00
pinned: false
description: 用 OpenEmu 在 Mac 上一站式玩转 NES、GBA、PS1、NDS 等 25+ 平台老游戏：安装、添加 ROM、BIOS、手柄、存档与金手指全攻略。
tags: [Mac, 教程, 游戏]
category: 教程
draft: false
image: /images/covers/openemu-setup.avif
---

OpenEmu 是 macOS 上最流行的免费开源复古游戏模拟器：把 NES、SNES、GBA、NDS、PS1、N64、GameCube 等 25+ 平台的老游戏统一收进一个「类 iTunes」的游戏库里，拖入 ROM 自动识别平台、自动下载封面，开箱即用。

## 为什么选 OpenEmu

- **一站式**：一个 App 集合几十个平台的模拟核心，不用分别装十几款模拟器
- **游戏库管理**：自动整理封面、简介、平台分类，搜索和浏览体验像音乐 App
- **免费开源**：完全免费，代码开源，无广告无内购
- **体验现代**：原生支持手柄、云存档槽、显示滤镜、金手指，界面漂亮

## 系统要求

- **官方版（OpenEmu 2.4.1）**：Intel 版，M 系列芯片的 Mac 需要 Rosetta 2 转译运行，首次打开时系统会提示安装 Rosetta
- **M 系列用户推荐**：社区维护的原生 ARM 分支 [OpenEmu-Silicon](https://github.com/OpenEmu/OpenEmu-Silicon)，支持 macOS 11.0+，在 Sequoia / Tahoe 上测试可用，性能和兼容性更好

> 判断方法：点击左上角  →「关于本机」，芯片是「Apple M1/M2/M3…」就是 M 系列，选 OpenEmu-Silicon；是 Intel 就用官方版。

## 安装步骤

1. 打开官网 [openemu.org](https://openemu.org/)（或 GitHub Releases）下载最新版 dmg
2. 双击 dmg，把 OpenEmu 图标**拖进 Applications 文件夹**
3. 首次打开若提示「无法验证开发者」，去 **系统设置 → 隐私与安全性**，在下方点击「仍要打开」
4. 打开后会先让你选择默认支持的游戏平台（后面随时可以在设置里改），然后进入主界面

## 添加游戏

直接把 ROM 文件拖进 OpenEmu 窗口即可：

- **自动识别平台**：根据文件扩展名自动归类，比如 `.nes`、`.sfc`、`.gba`、`.nds`、`.iso` / `.cue`（PS1）等
- **自动下载封面**：联网后自动从数据库匹配封面图和简介，也可右键 →「编辑封面」手动替换
- **ROM 会被复制入库**：默认存放在 `~/Library/Application Support/OpenEmu/Game Library/`，入库后原来的文件可以删掉
- 常用按键：双击启动游戏，按 `Esc` 返回游戏库，右键游戏可管理存档、封面、删除

## BIOS 文件（PS1 等光盘平台需要）

PS1、Saturn、PC Engine CD 这类光盘平台需要 BIOS 才能运行。把 BIOS 文件直接拖进 OpenEmu 窗口即可自动入库。

PS1 常见 BIOS 文件：

| 文件 | 对应区域 |
| --- | --- |
| `scph5500.bin` | 日版（NTSC-J） |
| `scph5501.bin` | 美版（NTSC） |
| `scph5502.bin` | 欧版（PAL） |

> 注意文件名要完全一致，包括大小写；三个都放进去最省心。

## 手柄连接与配置

- Xbox Series X/S、DualShock 4、DualSense、Switch Pro 等手柄连接 Mac 后会被自动识别
- 到 **OpenEmu → 设置 → Controls** 里可以调整按键映射、按键连发等
- 键盘默认映射也很完整（方向键 + `X`/`Z` 等），没有手柄也能玩

## 快捷键与存档

OpenEmu 的存档体验接近现代主机，不用依赖游戏内的存档点：

- **保存存档**：游戏中按 `Cmd + S`（或在 HUD 工具栏点存档图标）
- **载入存档**：游戏中按 `Cmd + L`
- **存档槽**：右键游戏库里的游戏 →「存档」，可以管理多个存档槽位，随时切换
- **游戏内暂停**：`Cmd + P`（部分核心支持）

## 显示滤镜

想找回当年的屏幕质感？游戏窗口底部 HUD 工具栏有滤镜图标，可选：

- **CRT 滤镜**：扫描线、球面变形，还原显像管电视效果
- **LCD 滤镜**：还原 Game Boy 那种像素颗粒感
- **Smooth 平滑**：画面更柔和的放大效果

## 金手指（Cheat Code）

支持 Game Genie、GameShark、Pro Action Replay 格式：

1. 游戏中打开 **Controls → Insert Cheat Code**
2. 粘贴代码并起个名字，勾选启用即可

## 常见问题

- **游戏没声音**：到 **设置 → 核心** 里检查对应平台核心的音频选项
- **N64 游戏崩溃 / 花屏**：右键游戏 →「Open With」，换一个视频插件（如 Rice / GlideN64）试试
- **打开提示「已损坏」或无法验证**：系统设置 → 隐私与安全性 →「仍要打开」
- **PS1 游戏不加载**：检查 BIOS 文件名是否正确（含大小写）、是否已拖入库
- **M 系列芯片卡顿**：优先用 OpenEmu-Silicon 原生版，而不是官方 Intel 版
- **封面没下载**：确认网络正常，或右键游戏手动编辑封面

## 关于游戏来源

OpenEmu 本身合法，但 ROM 的获取要留意版权：

- 推荐自己拥有的卡带/光盘的备份（如用 Epilogue GB Operator、RetroDE 等设备 dump）
- 公有领域、免费软件（如 Internet Archive 上的复古免费软件）
- GOG 等平台销售的复古合集
- 下载非自己拥有的商业游戏 ROM 在法律上属于灰区，不建议在公开场合传播

## 小结

装好 OpenEmu，把 ROM 拖进去，接上手柄，就能在一个漂亮的游戏库里重温 NES 到 PS1 的经典作品。祝游戏愉快！
