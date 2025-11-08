import React from 'react';
import Pop from '../pop';
import styles from './littlePop.module.less';
import CloseButton from '../../close/CloseButton';

/*
  LittlePop 小弹窗
  Props:
  - title?: string | ReactNode 标题
  - width?: number | string 宽度，默认 420
  - children?: 内容区域
  - footer?: ReactNode 自定义底部操作区
*/

const LittlePop = ({
										 title,
										 width = 500,
										 children,
										 footer,
									 }) => {

	return (
		<Pop isLittle={true}>
			<div className={`${styles.panel} popItemRelative`} style={{width}} role="dialog" aria-modal="true">

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
