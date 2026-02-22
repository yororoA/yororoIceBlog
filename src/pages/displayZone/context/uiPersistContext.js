import { createContext } from 'react';

export const UiPersistContext = createContext({
  langViewMode: 'pie',
  setLangViewMode: () => {},
  articlesSelectedCategory: 'all',
  setArticlesSelectedCategory: () => {},
  archiveSelectedType: 'all',
  setArchiveSelectedType: () => {},
  archiveSelectedYear: 'all',
  setArchiveSelectedYear: () => {},
  linksExpanded: true,
  setLinksExpanded: () => {},
  guestbookExpanded: true,
  setGuestbookExpanded: () => {},
  linksSelectedCategory: 'all',
  setLinksSelectedCategory: () => {},
});
