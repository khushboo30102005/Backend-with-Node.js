import { createContext, useContext, useMemo, useState } from 'react';

// The search field lives in the top bar (Layout) while the filtering itself
// stays client-side inside DirectoryView. This context just connects them.
const SearchContext = createContext(null);

const FALLBACK = {
  query: '',
  setQuery: () => {},
  enabled: false,
  setEnabled: () => {},
};

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');
  const [enabled, setEnabled] = useState(false);
  const value = useMemo(
    () => ({ query, setQuery, enabled, setEnabled }),
    [query, enabled],
  );
  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSearch() {
  return useContext(SearchContext) || FALLBACK;
}