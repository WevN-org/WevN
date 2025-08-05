// src/context/LogContext.jsx
import { createContext, useContext } from 'react';

export const LogContext = createContext({
  logs: [],
  addLog: () => {},
});

export function useLog() {
  return useContext(LogContext);
}
