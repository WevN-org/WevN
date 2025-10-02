import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'react-toastify';

// Local Component Imports
import GraphViewToggle from './graph_view_toggle';

// API & Context Imports
import { ApiService } from '../../../../backend/api-service/api_service';
import { useLinks } from '../../contexts/link-context/link_context';
import { useRagList } from '../../contexts/rag-list-context/rag_list_context';
import { useMessages } from '../../contexts/message-context/message_context';

// Remove 'setState' from the component's props
function PromptContainer({ graphVisibility, toggleGraph }) {
    // 2. Consume the messages context to get the updater function and active ID
    const { updateMessages, activeDomainId, currentDomainObject } = useMessages();

    // Other context hooks
    const { domainLinks } = useLinks();

    const { setRagList } = useRagList();

    // Local component state
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef(null);

    // useEffect for auto-resizing the textarea (no changes here)
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
    }, []);

    const handleSendMessage = useCallback(async () => {
        const userMessage = inputValue;
        if (!userMessage || !currentDomainObject || !activeDomainId) {
            if (!currentDomainObject) {
                toast.error("No active domain selected.");
            }
            return;
        }

        setInputValue("");

        // 3. Update state using the context function
        let assistantIndex;
        updateMessages(activeDomainId, (prevMessages) => {
            const userMsg = {
                role: "user",
                id: `user-${Date.now()}`,
                content: userMessage
            };
            const assistantMsg = {
                role: "assistant",
                id: `user-${Date.now()}`,
                content: ""
            };
            assistantIndex = prevMessages.length + 1;
            return [...prevMessages, userMsg, assistantMsg];
        });

        try {
            const domainSettings = domainLinks[currentDomainObject.id];
            const effectiveMaxLinks = domainSettings?.max_links ?? 20;
            const effectiveThreshold = domainSettings?.distance_threshold ?? 1.3;

            await ApiService.llm_response(
                currentDomainObject.name,
                userMessage,
                activeDomainId,
                effectiveMaxLinks,
                effectiveThreshold,
                (partial) => { // onChunk handler
                    // 4. Update the streaming message using the context
                    updateMessages(activeDomainId, (prev) => {
                        const updatedMessages = [...prev];
                        const currentAssistantMessage = updatedMessages[assistantIndex];
                        if (currentAssistantMessage) {
                            updatedMessages[assistantIndex] = {
                                ...currentAssistantMessage,
                                content: (currentAssistantMessage.content || "") + partial,
                            };
                        }
                        return updatedMessages;
                    });
                },
                (retrievedIds) => { // onRetrievedIds handler
                    setRagList(retrievedIds);
                }
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            toast.error(msg);
            // 5. On error, remove the placeholder using the context
            updateMessages(activeDomainId, prev => prev.slice(0, -2));
        }
    }, [inputValue, currentDomainObject, domainLinks, updateMessages, activeDomainId, setRagList]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    const isInputEmpty = inputValue.trim() === '';

    return (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 font-sans antialiased">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 p-3 flex items-end space-x-2">
                <GraphViewToggle
                    graphVisibility={graphVisibility}
                    onToggle={toggleGraph}
                />
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Explore your knowledgebase..."
                    rows={1}
                    className="flex-1 resize-none overflow-auto bg-transparent text-gray-800 text-base p-2 leading-relaxed focus:outline-none placeholder-gray-400 max-h-64"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isInputEmpty}
                    aria-label="Send message"
                    className={`p-2 rounded-xl transition-colors duration-300 ${isInputEmpty
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                >
                    <Send size={24} />
                </button>
            </div>
        </div>
    );
}

export default PromptContainer;