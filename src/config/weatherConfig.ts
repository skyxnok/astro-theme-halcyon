// 天气组件配置
export type WeatherConfig = {
	// uapis.cn API Keys（在 https://uapis.cn 控制台创建）
	// 免费接口不带 key 也能用，但容易被公共限流；可配置多个 key 轮换使用分摊免费额度
	apiKeys: string[];
	// 默认城市名（可选），如 "北京"；不配置则按访问者 IP 自动定位
	city?: string;
	// 行政区划代码（可选），如 "110000"；优先级高于 city
	adcode?: string;
	// 是否显示扩展信息（湿度/气压/空气质量等），默认 true
	extended?: boolean;
	// 高德天气 API Key（可选备用通道：uapis.cn 不可用时自动降级到高德）
	amapKey?: string;
};

export const weatherConfig: WeatherConfig = {
	apiKeys: [
		"uapi-_pusk-ngmfEcQvLV6RzUyxBj7WFivzr_evm0XbPc",
		"uapi-ob-wmdenLZ1nhHEGX11lgwRTYZ7V-bPxAbV-S-oq",
	],
	amapKey: "55b9af327f8d489b214eda4153c91b33",
};
