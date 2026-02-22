import {createContext} from "react";

export const CommentsLikedContext = createContext({
	likedComments: [],
	commentLikedChange: () => {},
});