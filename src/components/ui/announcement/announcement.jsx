import React, { useMemo } from 'react';
import styles from './announcement.module.less';

// 非常轻量级的 Markdown -> HTML 转换，仅支持常见基础语法：
// 1. 标题：# ~ ######
// 2. 粗体：**text** / __text__
// 3. 斜体：*text* / _text_
// 4. 链接：[text](url)
// 5. 段落 / 换行：空行分段，单行内换行 -> <br />
const basicMarkdownToHtml = (markdown = '') => {
	if (!markdown) return '';

	let html = markdown.trim();

	// 先对基础字符做转义，避免意外注入
	html = html
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

	// 标题（从 h6 到 h1，避免被前面的规则覆盖）
	html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
	html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
	html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
	html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
	html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
	html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

	// 粗体 / 斜体
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
	html = html.replace(/_(.+?)_/g, '<em>$1</em>');
	html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

	// 链接
	html = html.replace(
		/\[([^\]]+)]\(([^)]+)\)/g,
		'<a href="$2" target="_blank" rel="noreferrer">$1</a>'
	);

	// 段落：以空行分段；段内换行 -> <br />
	const blocks = html
		.split(/\n{2,}/)
		.map(block => block.replace(/\n/g, '<br />'));

	return blocks.map(b => `<p>${b}</p>`).join('');
};

const Announcement = ({ markdown, onClose }) => {
	const [dontShowAgain, setDontShowAgain] = React.useState(false);
	const html = useMemo(
		() => basicMarkdownToHtml(markdown),
		[markdown]
	);

	const handleClose = () => {
		onClose(dontShowAgain);
	};

	return (
		<section className={styles.entire} onClick={e => e.stopPropagation()}>
			<header className={styles.header}>
				<h3>{'公告'}</h3>
				<button type="button" className={styles.close} onClick={handleClose}>
					{'×'}
				</button>
			</header>
			<article
				className={styles.content}
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			<footer className={styles.footer}>
				<label className={styles.dontShow}>
					<input
						type="checkbox"
						checked={dontShowAgain}
						onChange={e => setDontShowAgain(e.target.checked)}
					/>
					<span>{'下次不再显示'}</span>
				</label>
				<button type="button" className={styles.confirmBtn} onClick={handleClose}>
					{'关闭'}
				</button>
			</footer>
		</section>
	);
};

export default Announcement;

