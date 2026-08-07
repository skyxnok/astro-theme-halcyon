/**
 * 恋爱计时小组件配置（我和宝宝在一起已经）
 * 数据来源：Seasir-Hyde/Firefly-hyde
 */
export type RelationshipConfig = {
	// 在一起开始日期
	startDate: string;
	// 双方昵称
	name1: string;
	name2: string;
	// 双方头像（可用本地 /avatar.png 或图片链接）
	avatar1: string;
	avatar2: string;
	// 小组件标题
	title: string;
};

export const relationshipConfig: RelationshipConfig = {
	// 示例配置，请改成你自己的
	startDate: "2026-01-01",
	name1: "TA",
	name2: "我",
	avatar1: "/avatar.png",
	avatar2: "/avatar.png",
	title: "我和宝宝在一起已经",
};
