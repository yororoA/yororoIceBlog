import { createContext } from "react";

/** value: [momentsData, setMomentsData, likedMoments, setLikedMoments, momentsFilesCache, setMomentsFilesCache, deletingIds, markMomentDeleting, pendingNewMoments, loadPendingNewMoments] */
export const MomentsListContext = createContext([[], () => {}, [], () => {}, {}, () => {}, [], () => {}, [], () => {}]);
