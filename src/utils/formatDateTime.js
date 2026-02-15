// 统一的时间格式化工具
// 输入示例: "Sun Oct 05 2025 20:51:48 GMT+0800 (中国标准时间)"
// 输出示例: "2025-10-05 20:51"
export const formatDateTime = (dateStr) => {
	if (!dateStr) return '';

	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) {
		// 无法被正确解析时，直接返回原始字符串，避免展示为空
		return dateStr;
	}

	const pad = (n) => n.toString().padStart(2, '0');

	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hour = pad(date.getHours());
	const minute = pad(date.getMinutes());

	return `${year}-${month}-${day} ${hour}:${minute}`;
};

