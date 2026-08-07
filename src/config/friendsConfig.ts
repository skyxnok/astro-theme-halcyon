import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
  // 页面标题，如果留空则使用 i18n 中的翻译
  title: "SkyのXnok的友链",

  // 页面描述文本，如果留空则使用 i18n 中的翻译
  description: "欢迎来到我的友链页面！这里展示了我与其他博客和网站的友好连接。",

  // 是否显示底部自定义内容（friends.mdx 中的内容）
  // 本站信息、申请表单、注意事项已内联到 friends.astro，故关闭
  showCustomContent: false,

  // 是否显示评论区，需要先在commentConfig.ts启用评论系统
  showComment: true,

  // 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
  randomizeSort: false,

  // 本站点信息（用于友链申请表单）
  site: {
    name: "SkyのXnok",
    desc: "记录学习、生活与思考",
    url: "https://201562.xyz",
    avatar: "https://201562.xyz/avatar.png",
    email: "skyxnok@201562.xyz",
  },

  // 注意事项（申请表单下方展示）
  notes: [
    {
      title: "互换原则",
      content: "请先将本站添加到您的友链页面，确认后会添加您的友链",
    },
    {
      title: "链接维护",
      content: "友链网站长期无法访问或内容违规，将会被移除",
    },
    {
      title: "内容要求",
      content: "内容积极向上，不含有任何含色情/反动/暴力等违法违规内容",
    },
    {
      title: "站点要求",
      content: "支持 HTTPS，以原创内容为主，能够正常访问且有持续更新",
    },
    {
      title: "通过审核",
      content: "工作日 48 小时内，节假日顺延。",
    },
  ],

  // 申请表单提交接口（POST JSON），留空则使用邮件发送
  apiEndpoint: "",
};

// 友链配置：在这里添加你的友链
// 格式示例：
// {
//   title: "友站名称",
//   imgurl: "https://example.com/avatar.png",
//   desc: "一句话描述",
//   siteurl: "https://example.com",
//   tags: ["Blog"],
//   weight: 10,
//   enabled: true,
// }
export const friendsConfig: FriendLink[] = [
  {
    title: "Firefly Docs",
    desc: "Firefly主题模板文档",
    siteurl: "https://docs-firefly.cuteleaf.cn",
    imgurl: "https://docs-firefly.cuteleaf.cn/logo.png",
    tags: ["Docs"],
    weight: 10,
    enabled: true,
  },
  {
    title: "Mizuki-Ultra",
    desc: "一个简约&功能丰富的 Astro 博客 主题",
    siteurl: "https://docs.mizuki.mysqil.com/",
    imgurl: "https://docs.mizuki.mysqil.com/favicon.png",
    tags: ["Docs"],
    weight: 8,
    enabled: true,
  },
  {
    title: "Sigrika-善良耙耙柑🍊",
    desc: "记录我的二次元之旅",
    siteurl: "https://qwq.sigrika.cc/",
    imgurl: "https://qwq.sigrika.cc/assets/images/avatar.gif",
	tags: ["Astro"],
    weight: 8,
    enabled: true,
  },
    {
    title: "Nachcekoの小窝",
    desc: "1つの熱愛の2次元の小さい萌の新しい~ /.こんにちはnya~です",
    siteurl: "https://blog.nachceko.qzz.io",
    imgurl: "https://avatars.githubusercontent.com/u/172878250?v=4",
	tags: ["Astro"],
    weight: 8,
    enabled: true,
  },
     {
    title: "Hyde Blog",
    desc: "人心中的成见是一座大山",
    siteurl: "https://seasir.top",
    imgurl: "https://seasir.top/assets/avatar.avif",
	tags: ["Astro"],
    weight: 8,
    enabled: true,
  },
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
  const friends = friendsConfig.filter((friend) => friend.enabled);

  if (friendsPageConfig.randomizeSort) {
    return friends.sort(() => Math.random() - 0.5);
  }

  return friends.sort((a, b) => b.weight - a.weight);
};
