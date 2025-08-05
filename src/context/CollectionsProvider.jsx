// src/context/LogProvider.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { CollectionContext } from './CollectionContext';
import { useLog } from '../context/LogContext';



export default function CollectionsProvider({ children }) {
  // Load on first mount
  const [currentCollection,setCurrentCollection]=useState("")
  const { addLog } = useLog();

    const setCollection = useCallback((collection_name) => {
      
      setCurrentCollection(collection_name);
      localStorage.setItem("CurrentCollection", collection_name);
      addLog(`Global Collection Changed to ${collection_name}`)
      
    }, [addLog]);



      useEffect(() => {
    const saved = localStorage.getItem("CurrentCollection");
    if (saved) {
      setCollection(saved);
    }
  }, [setCollection]);





  return (
    <CollectionContext.Provider value={{ currentCollection, setCollection }}>
      {children}
    </CollectionContext.Provider>
  );
}
