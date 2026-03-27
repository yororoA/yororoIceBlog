const SUPPORTED_LOCALES = ['en', 'zh', 'ja', 'de'];

function isChineseRegionByTimeZone(tz) {
	if (!tz || typeof tz !== 'string') return false;
	return /^(Asia\/Shanghai|Asia\/Chongqing|Asia\/Harbin|Asia\/Urumqi|Asia\/Hong_Kong|Asia\/Macau|Asia\/Taipei)$/i.test(tz);
}

function isJapaneseRegionByTimeZone(tz) {
	if (!tz || typeof tz !== 'string') return false;
	return /^Asia\/Tokyo$/i.test(tz);
}

function isChineseRegionByLanguage(lang) {
	if (!lang || typeof lang !== 'string') return false;
	return /^zh([_-]|$)/i.test(lang);
}

function isJapaneseRegionByLanguage(lang) {
	if (!lang || typeof lang !== 'string') return false;
	return /^ja([_-]|$)/i.test(lang);
}

function isGermanRegionByLanguage(lang) {
	if (!lang || typeof lang !== 'string') return false;
	return /^de([_-]|$)/i.test(lang);
}

export function detectRegionLocale() {
	let timeZone = '';
	let lang = '';
	try {
		timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
	} catch (_) {}
	try {
		lang = (navigator.language || (Array.isArray(navigator.languages) ? navigator.languages[0] : '') || '').trim();
	} catch (_) {}

	// 中国地区 -> zh
	if (isChineseRegionByTimeZone(timeZone) || isChineseRegionByLanguage(lang)) return 'zh';
	// 日本地区 -> en
	if (isJapaneseRegionByTimeZone(timeZone) || isJapaneseRegionByLanguage(lang)) return 'en';
	// 德语地区 -> de
	if (isGermanRegionByLanguage(lang)) return 'de';
	// 其他地区 -> en
	return 'en';
}

export function getInitialUiLocale() {
	if (typeof localStorage === 'undefined') return 'en';
	const saved = localStorage.getItem('ui_locale');
	if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
	const detected = detectRegionLocale();
	localStorage.setItem('ui_locale', detected);
	return detected;
}
