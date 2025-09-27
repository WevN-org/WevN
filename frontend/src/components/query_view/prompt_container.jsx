import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import GraphViewToggle from './graph_view_toggle';
//import { fetchStreamingResponse } from '../../utils/fetchStreamingResponse';
import { ApiService } from '../../../../backend/api-service/api_service';
import { useDomain } from '../../contexts/domain-context/domain_context';
import { toast } from 'react-toastify';
import { useDomainsList } from '../../contexts/domans-list-context/domains_list_context';
import { useLinks } from '../../contexts/link-context/link_context';

/**
 * A React component that creates a UI for a prompt box.
 * It features a dynamically resizing textarea, an icon to toggle a graph, and a send button.
 */
function PromptContainer({ graphVisibility, toggleGraph, setState }) {
    const { domainLinks } = useLinks();
    const { currentDomain } = useDomain()
    const { domains } = useDomainsList();

    // console.log(state.domains)
    const [inputValue, setInputValue] = useState('');
    // use this id for switching chats for each domain and as llm query id makesure both are the same 
    const [currentId, setCurrentId] = useState("");



    const textareaRef = useRef(null);

    // Auto-resize the textarea as the user types
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [inputValue]);


    // update id upon change in current domain

    useEffect(() => {
        if (domains.length > 0) {
            console.log(domains)
            const dm = domains.find((d) => d.name === currentDomain)
            setCurrentId(dm.id)
        }
    }, [currentDomain])

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendMessage = async () => {
        if (inputValue.trim()) {
            const userMessage = inputValue;
            setInputValue("");

            try {
                let assistantIndex;
                setState((prev) => {
                    const userMsg = { role: "user", content: userMessage };
                    const assistantMsg = { role: "assistant", content: "" };

                    assistantIndex = prev.messages.length + 1; // after user message
                    return {
                        ...prev,
                        messages: [...prev.messages, userMsg, assistantMsg],
                    };
                });
                let effectiveMaxLinks = 20;
                let effectiveThreshold = 1.3;
                try {
                    if (domains.length > 0) {
                        console.log(domains)
                        const dm = domains.find((d) => d.name === currentDomain)
                        console.log("dm", dm)
                        const saved = domainLinks[dm.id]
                        if (saved) {
                            console.log("svd", saved)
                            // setMaxSemanticLinks(saved.max_links ?? 20);
                            // setThreshold(saved.distance_threshold ?? 1.3);
                            effectiveMaxLinks = saved.max_links ?? 20;
                            effectiveThreshold = saved.distance_threshold ?? 1.3;

                        }
                    }
                }
                catch (e) {
                    console.log("error: ", e)
                }

                // Stream response
                await ApiService.llm_response(
                    currentDomain,        // 👈 your active domain (comes from useDomain())
                    userMessage,          // the query
                    currentId,           // or a real conversation_id if you track it
                    // maxSemanticLinks ?? 5,                    // max_results
                    // threshold ?? 1.0,                  // distance_threshold
                    effectiveMaxLinks,
                    effectiveThreshold,
                    (partial) => {        // onChunk handler
                        // console.log(partial);
                        setState((prev) => {
                            const updated = [...prev.messages];
                            const prevContent = updated[assistantIndex].content || "";
                            updated[assistantIndex] = {
                                role: "assistant",
                                content: prevContent + partial,
                            };
                            return { ...prev, messages: updated };
                        });
                    }
                );
            } catch (error) {
                console.log(error)
                toast.error(error)
            }

        }
    };


    const isInputEmpty = inputValue.trim() === '';

    return (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 font-sans antialiased">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 p-3 flex items-end space-x-2">

                {/* Graph toggle button */}
                <GraphViewToggle
                    graphVisibility={graphVisibility}
                    onToggle={toggleGraph}
                />

                {/* Input box */}
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault(); // prevent new line
                            handleSendMessage();
                        }
                    }}
                    placeholder="Explore your knowledgebase..."
                    rows={1}
                    className="flex-1 resize-none overflow-hidden bg-transparent text-gray-800 text-base p-2 leading-relaxed 
                    focus:outline-none placeholder-gray-400 max-h-64"
                />

                {/* Send button */}
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
