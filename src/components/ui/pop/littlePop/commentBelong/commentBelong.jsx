import React, {useState} from 'react';
import CloseButton from "../../../close/CloseButton";
import LittlePop from "../littlePop";
import styles from './styles.module.less';

const CommentBelong = ({belongUser, belongMSG, belongId, onEnd}) => {
	const handleClose = () => {

	}
	const [viewPop, setVP] = useState(false);
	const [content, setCT] = useState('');
	const handleInput = () => {

	}

	return (
		<LittlePop>
			<form action="">
				<h3>{'Reply'}</h3>
				<>
					<CloseButton onClick={onEnd}/>
				</>

				<p className={styles.infos}>
					<em>{belongUser}: </em>
					<i>{belongMSG}</i>
				</p>

				<input type="textarea" id={'replyInput'} required={true} placeholder={'reply...'} onChange={handleInput}
							 value={content} className={styles.input}/>
				<label htmlFor="replyInput"></label>

				<button type={"submit"} className={styles.btn}>{'reply'}</button>
			</form>
		</LittlePop>
	);
};

export default CommentBelong;
