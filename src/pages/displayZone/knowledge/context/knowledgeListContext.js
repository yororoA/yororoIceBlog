import { createContext } from "react";

/** value: [articlesData, setArticlesData, likedArticles, setLikedArticles, categories, setCategories] */
export const KnowledgeListContext = createContext([[], () => {}, [], () => {}, [], () => {}]);
