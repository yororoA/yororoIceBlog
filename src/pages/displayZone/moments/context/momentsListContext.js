import { createContext } from "react";

/** value: [momentsData, setMomentsData, likedMoments, setLikedMoments, momentsFilesCache, setMomentsFilesCache, deletingIds, markMomentDeleting] */
export const MomentsListContext = createContext([[], () => {}, [], () => {}, {}, () => {}, [], () => {}]);
