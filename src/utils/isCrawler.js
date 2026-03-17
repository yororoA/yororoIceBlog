/**
 * 检测当前请求是否来自搜索引擎爬虫/机器人。
 * 用于避免对爬虫执行登录页重定向，以便搜索引擎能索引站点主路径。
 */
const CRAWLER_UA_PATTERNS = [
	/Googlebot/i,
	/Bingbot/i,
	/Baiduspider/i,
	/YandexBot/i,
	/DuckDuckBot/i,
	/Slurp/i,        // Yahoo
	/facebookexternalhit/i,
	/Twitterbot/i,
	/rogerbot/i,
	/LinkedInBot/i,
	/embedly/i,
	/quora link preview/i,
	/outbrain/i,
	/pinterest/i,
	/slackbot/i,
	/vkshare/i,
	/W3C_Validator/i,
	/WhatsApp/i,
	/Applebot/i,
	/Sogou/i,
	/Exabot/i,
	/ia_archiver/i,
];

export function isCrawler() {
	if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
	const ua = navigator.userAgent;
	return CRAWLER_UA_PATTERNS.some((pattern) => pattern.test(ua));
}
