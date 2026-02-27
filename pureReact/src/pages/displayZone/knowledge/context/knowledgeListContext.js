import { createContext } from "react";

/** value: [articlesData, setArticlesData, likedArticles, setLikedArticles, categories, setCategories, pendingNewArticles, loadPendingNewArticles, deletingArticleIds, markArticleDeleting] */
export const KnowledgeListContext = createContext([
  [], () => {}, [], () => {}, [], () => {},
  [], () => {}, [], () => {},
]);
