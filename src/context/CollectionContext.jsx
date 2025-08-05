// src/context/CollectionContext.jsx
import { createContext, useContext } from 'react';

export const CollectionContext = createContext({
  currentCollection: "",
  setCollection: () => {},
});

export function useCollection() {
  return useContext(CollectionContext);
}
