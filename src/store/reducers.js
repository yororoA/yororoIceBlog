const momentNewReducer = (state, action) => {
	// { _id, title, content, uid, createdAt }
	state.infos = action.payload;
}

const commentNewReducer = (state, action) => {
	// { _id, momentId, uid, username, content, createdAt }
	state.infos = action.payload;
}

const momentLikesUpdatedReducer = (state, action) => {
	// { momentId, likes }
	state.infos = action.payload;
}

export {momentNewReducer, momentLikesUpdatedReducer, commentNewReducer};