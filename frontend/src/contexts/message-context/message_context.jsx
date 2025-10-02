import { createContext, useContext } from 'react';

/**
 * Defines the context for messages.
 * This file should NOT contain any state logic, only the context definition.
 */
export const MessagesContext = createContext(null);

/**
 * Custom hook for consuming the MessagesContext.
 * This provides a clean way for components to access the context's value.
 */
export const useMessages = () => {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessagesProvider');
    }
    return context;
};