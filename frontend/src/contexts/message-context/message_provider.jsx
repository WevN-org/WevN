import React, { useState, useCallback, useMemo } from 'react';
import { useDomain } from '../domain-context/domain_context';
import { useDomainsList } from '../domans-list-context/domains_list_context';
import { MessagesContext } from './message_context';
// import { useWhyDidYouUpdate } from '../../custom-hooks/useWhyDidYouUpdate';

const initialMessage = {
    role: "assistant",
    content: "Hi! Ask me anything about your knowledgebase."
};
const STABLE_INITIAL_MESSAGES = [initialMessage];
export const MessagesProvider = ({ children }) => {
    // 1. Consume from both hooks to get the necessary data
    const { currentDomain } = useDomain();
    const { domains } = useDomainsList();

    const [messagesByDomain, setMessagesByDomain] = useState({});

    // 2. Find the full domain object using the name and the list
    const currentDomainObject = useMemo(() => {
        if (!currentDomain || !domains || domains.length === 0) {
            return null;
        }
        return domains.find((d) => d.name === currentDomain);
    }, [currentDomain, domains]); // This recalculates only when the domain or list changes

    // The rest of the logic now works correctly with the derived object
    const currentMessages = useMemo(() => {
        if (!currentDomainObject) {
            // ✅ Use the stable reference
            return STABLE_INITIAL_MESSAGES;
        }
        // ✅ Use the stable reference as the fallback
        return messagesByDomain[currentDomainObject.id] || STABLE_INITIAL_MESSAGES;
    }, [currentDomainObject, messagesByDomain]);

    const updateMessagesForDomain = useCallback((domainId, newMessages) => {
        setMessagesByDomain(prev => ({
            ...prev,
            [domainId]: typeof newMessages === 'function'
                ? newMessages(prev[domainId] || STABLE_INITIAL_MESSAGES)
                : newMessages,
        }));
    }, []);

    const clearMessagesForDomain = useCallback((domainId) => {
        if (!domainId) return; // Guard clause
        setMessagesByDomain(prev => {
            const updatedMessages = { ...prev };
            // Reset the messages for this domain to the initial state
            updatedMessages[domainId] = STABLE_INITIAL_MESSAGES;
            return updatedMessages;
        });
    }, []);

    const value = useMemo(() => ({
        messages: currentMessages,
        updateMessages: updateMessagesForDomain,
        clearMessages: clearMessagesForDomain,
        activeDomainId: currentDomainObject?.id,
        currentDomainObject: currentDomainObject,
    }), [currentMessages, updateMessagesForDomain, currentDomainObject]);

    // useWhyDidYouUpdate('MessagesProvider', { 
    //   currentDomainObject, 
    //   messagesByDomain, 
    //   currentMessages, 
    //   value 
    // });

    return (
        <MessagesContext.Provider value={value}>
            {children}
        </MessagesContext.Provider>
    );
};