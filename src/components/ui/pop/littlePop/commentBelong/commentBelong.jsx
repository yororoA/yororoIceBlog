import React, { useCallback, useContext, useState } from 'react';
import CloseButton from "../../../close/CloseButton";
import LittlePop from "../littlePop";
import styles from './styles.module.less';
import { addComment } from '../../../../../utils/addComment';
import { SuccessBoardContext } from '../../status/successBoardContext';

const CommentBelong = ({ belongUser, belongMSG, belongId, momentId, setCommentToDt, onEnd }) => {
	const { showSuccess } = useContext(SuccessBoardContext);
	const [content, setContent] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = useCallback(async (e) => {
		e.preventDefault();
		const text = content.trim();
		if (!text || !momentId || !belongId || submitting) return;
		setSubmitting(true);
		try {
			const resp = await addComment({ momentId, comment: text, belong: belongId });
			if (resp && resp.message === 'ok' && resp.data?._id) {
				setCommentToDt(resp.data._id);
				showSuccess('Replied');
				setContent('');
				onEnd();
			}
		} catch (err) {
			console.error('Reply failed:', err);
		} finally {
			setSubmitting(false);
		}
	}, [content, momentId, belongId, setCommentToDt, onEnd, showSuccess, submitting]);

	return (
		<LittlePop>
			<form onSubmit={handleSubmit}>
				<h3>{'Reply'}</h3>
				<CloseButton onClick={onEnd} />

				<p className={styles.infos}>
					<em>{belongUser}: </em>
					<i>{belongMSG}</i>
				</p>

				<textarea
					id={`replyInput-${belongId}`}
					required
					placeholder={'reply...'}
					className={styles.input}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					rows={3}
				/>
				<label htmlFor={`replyInput-${belongId}`} />

				<button type="submit" className={styles.btn} disabled={submitting}>
					{submitting ? '...' : 'reply'}
				</button>
			</form>
		</LittlePop>
	);
};

export default CommentBelong;
