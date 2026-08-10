import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";

// 运动类型 -> 图标（按关键词匹配，找不到用默认健身图标）
const typeIcons: Record<string, string> = {
	跑步: "material-symbols:directions-run",
	夜跑: "material-symbols:directions-run",
	晨跑: "material-symbols:directions-run",
	慢跑: "material-symbols:directions-run",
	骑行: "material-symbols:directions-bike",
	骑车: "material-symbols:directions-bike",
	游泳: "material-symbols:pool",
	健身: "material-symbols:fitness-center",
	力量: "material-symbols:fitness-center",
	徒步: "material-symbols:hiking",
	登山: "material-symbols:hiking",
	爬山: "material-symbols:hiking",
	篮球: "material-symbols:sports-basketball",
	足球: "material-symbols:sports-soccer",
	网球: "material-symbols:sports-tennis",
	羽毛球: "material-symbols:sports-tennis",
	乒乓球: "material-symbols:sports-tennis",
	滑雪: "material-symbols:downhill-skiing",
	皮划艇: "material-symbols:kayaking",
	散步: "material-symbols:directions-walk",
};
const defaultTypeIcon = "material-symbols:fitness-center";

// 兜底：按关键词匹配（如「跑」「骑」「游」「登」）
const keywordFallbacks: Array<[string, string]> = [
	["跑", "material-symbols:directions-run"],
	["骑", "material-symbols:directions-bike"],
	["游", "material-symbols:pool"],
	["登", "material-symbols:hiking"],
	["徒", "material-symbols:hiking"],
	["爬", "material-symbols:hiking"],
	["走", "material-symbols:directions-walk"],
	["球", "material-symbols:sports-basketball"],
	["雪", "material-symbols:downhill-skiing"],
];

export function getTypeIcon(type: string): string {
	const exact = Object.entries(typeIcons).find(([k]) => type.includes(k))?.[1];
	if (exact) return exact;
	const fallback = keywordFallbacks.find(([k]) => type.includes(k))?.[1];
	return fallback || defaultTypeIcon;
}

// 时长格式化（输入为秒）：5小时 49分钟 14秒 / 45分钟 / 30秒
export function fmtDurationSec(totalSec: number): string {
	const s = Math.round(totalSec);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;

	const parts: string[] = [];
	if (h > 0) parts.push(`${h}${i18n(I18nKey.sportsHours)}`);
	if (m > 0 || h > 0) parts.push(`${m}${i18n(I18nKey.sportsMinutes)}`);
	if (sec > 0) parts.push(`${sec}${i18n(I18nKey.sportsSeconds)}`);
	return parts.length > 0 ? parts.join(" ") : `0${i18n(I18nKey.sportsMinutes)}`;
}
