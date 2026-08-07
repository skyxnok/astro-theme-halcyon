// 天气组件配置
export type WeatherConfig = {
	// uapis.cn API Key（在 https://uapis.cn 控制台创建）
	// 免费接口不带 key 也能用，但容易被公共限流；带上 key 更稳定
	apiKey: string;
	// 默认城市名（可选），如 "北京"；不配置则按访问者 IP 自动定位
	city?: string;
	// 行政区划代码（可选），如 "110000"；优先级高于 city
	adcode?: string;
	// 是否显示扩展信息（湿度/气压/空气质量等），默认 true
	extended?: boolean;
};

export const weatherConfig: WeatherConfig = {
	apiKey: "uapi-_pusk-ngmfEcQvLV6RzUyxBj7WFivzr_evm0XbPc",
};
