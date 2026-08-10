// 友链配置
export type FriendLink = {
	title: string; // 友链标题
	imgurl: string; // 头像图片URL
	desc: string; // 友链描述
	siteurl: string; // 友链地址
	tags?: string[]; // 标签数组
	weight: number; // 权重，数字越大排序越靠前
	enabled: boolean; // 是否启用
};

export type FriendsPageConfig = {
	title?: string; // 页面标题，留空则使用 i18n 中的翻译
	description?: string; // 页面描述，留空则使用 i18n 中的翻译
	showCustomContent?: boolean; // 是否显示自定义内容（friends.mdx）
	showComment?: boolean; // 是否显示评论区，默认 true
	randomizeSort?: boolean; // 是否打乱排序，如果为 true，将忽略 weight，随机排序
	// 本站点信息（用于友链申请表单）
	site?: {
		name: string; // 站点名称
		desc: string; // 站点描述
		url: string; // 站点链接
		avatar: string; // 头像链接
		email?: string; // 联系邮箱（申请表单邮件兜底）
	};
	// 注意事项（申请表单下方展示）
	notes?: Array<{ title: string; content: string }>;
	// 申请表单提交接口（POST JSON），留空则使用邮件发送
	apiEndpoint?: string;
	// 友链数据远程 JSON 地址（独立仓库），设置后页面运行时从这里加载，加载失败回退本地配置
	dataUrl?: string;
};
