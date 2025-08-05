
// src/context/LogContext.jsx
import { createContext, useContext } from 'react';

export const CollectionContext = createContext({
  CurrentCollection: "",
  changeCollection: () => {},
});

export function useLog() {
  return useContext(CollectionContext);
}
