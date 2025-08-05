// src/context/LogProvider.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { CollectionContext } from './CollectionContext';
import { useLog } from '../context/LogContext';



export default function CollectionsProvider({ children }) {
  // Load on first mount
  const [CurrentCollection,changeCollection]=useState[""]
  const { addLog } = useLog();


      useEffect(() => {
    const saved = localStorage.getItem("CurrentCollection");
    if (saved) {
      setCollection(saved);
    }
  }, [setCollection]);


  const setCollection = useCallback((collection_name) => {
      
      changeCollection(collection_name);
      localStorage.setItem("CurrentCollection", collection_name);
      addLog(`Global Collection Changed to ${collection_name}`)
      
    }, [addLog, changeCollection]);



  return (
    <CollectionContext.Provider value={{ CurrentCollection, setCollection }}>
      {children}
    </CollectionContext.Provider>
  );
}
