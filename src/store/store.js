import {configureStore} from "@reduxjs/toolkit";
import {updatedCommentSlice, updatedMomentLikesSlice, updatedMomentSlice} from "./slices";

const store = configureStore({
	reducer: {
		momentNew: updatedMomentSlice.reducer,
		commentNew: updatedCommentSlice.reducer,
		momentLikes: updatedMomentLikesSlice.reducer
	}
});

export {store};