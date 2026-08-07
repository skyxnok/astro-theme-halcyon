---
title: macOS 下 oh-my-zsh 安装与美化教程
published: 2026-08-07T16:44:00+08:00
pinned: false
description: 从零配置 zsh + oh-my-zsh + powerlevel10k，让终端变得好用又好看，附字体与插件配置。
tags: [教程, 工具, macOS]
category: 教程
draft: false
image: /images/covers/oh-my-zsh-setup.avif
---

从零开始把终端配置成好用又好看的样子：zsh + oh-my-zsh + powerlevel10k + 常用插件。

## 为什么是 zsh

macOS 和大多数 Linux 发行版都自带 zsh（macOS 从 Catalina 起默认 shell 就是 zsh）。配合 oh-my-zsh，开箱即得：

- 丰富的主题和配色
- 强大的补全（命令、路径、git 状态）
- 插件生态（语法高亮、自动建议、目录跳转等）

## 第一步：安装 oh-my-zsh

macOS 已自带 zsh，直接安装 oh-my-zsh：

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

安装完成后会生成 `~/.zshrc`，主题默认是 `robbyrussell`。如果是 Linux 且没有 zsh，先装：

```sh
sudo apt install -y zsh git curl && chsh -s $(which zsh)
```

## 第二步：安装 powerlevel10k 主题

powerlevel10k 是目前最流行的主题，提示信息丰富且启动极快（比同类主题快很多）：

```sh
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

然后修改 `~/.zshrc`，把主题名改成：

```sh
ZSH_THEME="powerlevel10k/powerlevel10k"
```

重新打开终端（或 `source ~/.zshrc`），会自动进入交互式配置向导 `p10k configure`，按提示选择你喜欢的样式即可。之后想重新配置随时运行：

```sh
p10k configure
```

## 第三步：安装 Nerd Font 字体（关键！）

powerlevel10k 的图标依赖 Nerd Font，否则会显示成方块乱码。推荐 [MesloLGS NF](https://github.com/romkatv/powerlevel10k#fonts)（p10k 官方推荐，三选一安装即可）：

1. 下载并双击安装：MesloLGS NF Regular / Bold / Italic
2. iTerm2：**Settings → Profiles → Text → Font** 选择 `MesloLGS NF`
3. 终端 App：**Settings → Profiles → Text → Font** 同理
4. VS Code 终端：设置 `"terminal.integrated.fontFamily": "MesloLGS NF"`

> 其他终端（Alacritty、Kitty、Warp）在各自的配置文件中把字体设为 `MesloLGS NF` 即可。

## 第四步：安装常用插件

### zsh-autosuggestions（命令自动建议，灰色历史命令提示）

```sh
git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

### zsh-syntax-highlighting（命令语法高亮，命令存在才显示绿色）

```sh
git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

### zsh-completions（额外补全）

```sh
git clone --depth=1 https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-completions
```

然后编辑 `~/.zshrc` 的插件列表：

```sh
plugins=(
    git
    z
    extract
    zsh-autosuggestions
    zsh-syntax-highlighting
    zsh-completions
)
```

重新加载：`source ~/.zshrc`。

> 注意：`zsh-syntax-highlighting` 必须放在插件列表**最后**，否则高亮不生效。

## 第五步：优化 .zshrc

在 `~/.zshrc` 末尾追加常用优化：

```sh
# 历史记录带时间戳，数量加大
HIST_STAMPS="yyyy-mm-dd"
HISTSIZE=10000
SAVEHIST=10000

# 常用别名
alias ll='ls -lah'
alias la='ls -la'
alias zshrc='vim ~/.zshrc'
alias zshreload='source ~/.zshrc'

# 自定义 PATH（示例）
# export PATH=$HOME/bin:/usr/local/bin:$PATH
```

## 第六步：iTerm2 配色（可选）

1. 下载喜欢的配色，如 [dracula](https://draculatheme.com/iterm) 或 [catppuccin](https://github.com/catppuccin/iterm)
2. iTerm2 → **Settings → Profiles → Colors → Color Presets → Import**，导入后选择

## 常见问题

- **主题图标显示为方块/问号**：没有装 Nerd Font，或终端字体没切换成 `MesloLGS NF`
- **`p10k configure` 没自动弹出**：运行 `p10k configure` 手动启动
- **语法高亮不生效**：`zsh-syntax-highlighting` 没有放在插件列表最后
- **终端启动慢**：插件不要贪多，只保留常用的即可
- **`command not found: p10k`**：确认主题目录存在：`ls ~/.oh-my-zsh/custom/themes/powerlevel10k`

## 最终效果

配置完成后，终端会显示：当前目录、git 分支与状态、命令执行时间、Python/Node 版本（如果你在 p10k 配置里开启），输入命令时有灰色历史建议、错误命令标红、路径切换有 `z` 快捷跳转——好看又好用。
