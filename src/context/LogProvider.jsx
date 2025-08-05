// src/context/LogProvider.jsx
import React, { useCallback, useState } from 'react';
import { LogContext } from './logContext';

export default function LogProvider({ children }) {
  const [logs, setLogs] = useState(["🔧 Logging initialized"]);

  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Log] ${message}`);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog }}>
      {children}
    </LogContext.Provider>
  );
}
