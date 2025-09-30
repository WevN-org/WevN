import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send } from 'lucide-react';
import GraphViewToggle from './graph_view_toggle';
import { ApiService } from '../../../../backend/api-service/api_service';
import { useDomain } from '../../contexts/domain-context/domain_context';
import { toast } from 'react-toastify';
import { useDomainsList } from '../../contexts/domans-list-context/domains_list_context';
import { useLinks } from '../../contexts/link-context/link_context';
import { useRagList } from '../../contexts/rag-list-context/rag_list_context';

function PromptContainer({ graphVisibility, toggleGraph, setState }) {
    const { domainLinks } = useLinks();
    const { currentDomain } = useDomain();
    const { domains } = useDomainsList();
    const { setRagList } = useRagList(); 
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize the textarea - this is a perfect use case for useEffect.
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    const currentDomainObject = useMemo(() => {
        if (!currentDomain || domains.length === 0) return null;
        return domains.find((d) => d.name === currentDomain);
    }, [currentDomain, domains]);

    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
    }, []); // No dependencies, so this function is created only once.

    const handleSendMessage = useCallback(async () => {
        const userMessage = inputValue.trim();
        if (!userMessage || !currentDomainObject) {
            if (!currentDomainObject) {
                toast.error("No active domain selected.");
            }
            return;
        }

        setInputValue("");

        // Add user message and assistant placeholder immediately for better UX
        let assistantIndex;
        setState((prev) => {
            const userMsg = { role: "user", content: userMessage };
            const assistantMsg = { role: "assistant", content: "" };
            assistantIndex = prev.messages.length + 1;
            return {
                ...prev,
                messages: [...prev.messages, userMsg, assistantMsg],
            };
        });

        try {
            //: Get settings directly from the memoized domain object.
            const domainSettings = domainLinks[currentDomainObject.id];
            const effectiveMaxLinks = domainSettings?.max_links ?? 20;
            const effectiveThreshold = domainSettings?.distance_threshold ?? 1.3;

            await ApiService.llm_response(
                currentDomain,
                userMessage,
                currentDomainObject.id, // Use the directly derived ID
                effectiveMaxLinks,
                effectiveThreshold,
                (partial) => { // onChunk handler
                    setState((prev) => {
                        const updatedMessages = [...prev.messages];
                        const currentAssistantMessage = updatedMessages[assistantIndex];
                        if (currentAssistantMessage) {
                             updatedMessages[assistantIndex] = {
                                ...currentAssistantMessage,
                                content: (currentAssistantMessage.content || "") + partial,
                            };
                        }
                        return { ...prev, messages: updatedMessages };
                    });
                },
                (retrievedIds) => { // onRetrievedIds handler
                    console.log("Received retrieved IDs:", retrievedIds);
                    setRagList(retrievedIds);
                }
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            toast.error(msg);
            console.error("Error sending message:", error);
            // Optional: Remove the placeholder message on error
            setState(prev => ({
                ...prev,
                messages: prev.messages.slice(0, -1) // Removes the last (assistant) message
            }));
        }
    }, [inputValue, currentDomain, currentDomainObject, domainLinks, setState, setRagList]);


    // 3.  MEMOIZED HANDLER: Wrap the keydown handler in useCallback.
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
                    onKeyDown={handleKeyDown} // Use the memoized handler
                    placeholder="Explore your knowledgebase..."
                    rows={1}
                    className="flex-1 resize-none overflow-hidden bg-transparent text-gray-800 text-base p-2 leading-relaxed focus:outline-none placeholder-gray-400 max-h-64"
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