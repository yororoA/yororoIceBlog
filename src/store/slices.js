import {createSlice} from "@reduxjs/toolkit";
import {commentNewReducer, momentLikesUpdatedReducer, momentNewReducer} from "./reducers";

const updatedMomentSlice = createSlice({
	name: 'momentNew',
	initialState: {infos: {}},
	reducers: {momentNew: momentNewReducer}
});

const updatedCommentSlice = createSlice({
	name: 'commentNew',
	initialState: {infos: {}},
	reducers: {commentNew: commentNewReducer}
});

const updatedMomentLikesSlice = createSlice({
	name: 'momentLikesUpdated',
	initialState: {infos: {}},
	reducers: {momentLikesUpdated: momentLikesUpdatedReducer}
});

export {updatedMomentSlice, updatedMomentLikesSlice, updatedCommentSlice};