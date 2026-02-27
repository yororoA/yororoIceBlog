import React from 'react';
import Pop from '../pop';
import styles from './littlePop.module.less';

/*
	LittlePop 小弹窗
	Props:
	- title?: string | ReactNode 标题
	- width?: number | string 宽度，默认 420
	- children?: 内容区域
	- footer?: ReactNode 自定义底部操作区
	- onClose?: (proceed: () => void) => void 点击遮罩/关闭时调用，需调用 proceed() 才会关闭
*/

const LittlePop = ({
	title,
	width = 500,
	children,
	footer,
	onClose,
}) => {

	return (
		<Pop isLittle={true} onClose={onClose}>
			<div className={`${styles.panel} popItemRelative`} style={{ width }} role="dialog" aria-modal="true">

				{(title || title === 0) && (
					<div className={styles.header}>
						<h3 className={styles.title}>{title}</h3>
					</div>
				)}

				<div className={styles.body}>
					{children}
				</div>

				{footer && (
					<div className={styles.footer}>
						{footer}
					</div>
				)}
			</div>
		</Pop>
	);
};

export default LittlePop;
