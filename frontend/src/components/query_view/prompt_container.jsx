import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import GraphViewToggle from './graph_view_toggle';
import { motion } from "framer-motion";
import { changeDomain } from '../../contexts/domain-context/domain_context';


/**
 * A React component that creates a UI for a Claude AI-style prompt box.
 * It features a dynamically resizing textarea, a domain selector,
 * an icon to toggle a graph, and a send button.
 */
function PromptContainer({ graphVisibility, toggleGraph, state, setState }) {

    console.log(state.domains)
    const [inputValue, setInputValue] = useState('');
    const {currentDomain,setDomain} = changeDomain();
    const textareaRef = useRef(null);
    const domainRef = useRef(null);
    const [showDomains, setShowDomains] = useState(false);

    // Auto-resize the textarea as the user types
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [inputValue]);

    // Handle clicks outside the domain selector to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (domainRef.current && !domainRef.current.contains(event.target)) {
                setShowDomains(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [domainRef]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendMessage = () => {
        if (inputValue.trim()) {
            console.log('Sending message:', inputValue);
            // Logic for sending message goes here
            setInputValue(''); // Clear the input after sending
        }
    };

    const handleDomainSelect = (domain) => {
        setDomain(domain);
        setShowDomains(false);
    };


    const isInputEmpty = inputValue.trim() === '';

    return (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end bg-transparent p-4 font-sans antialiased">
            <div className="max-w-3xl w-full">
                <div className="relative">
                    {/* Main prompt box container */}
                    <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 p-2">

                        {/* Input and Send button container - Now on the top */}
                        <div className="flex items-end space-x-2 pb-2 px-2">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder="Explore your knowledgebase..."
                                rows={1}
                                className="flex-1 resize-none overflow-hidden bg-transparent text-gray-800 text-base leading-relaxed p-2
                           focus:outline-none focus:ring-0 placeholder-gray-400 max-h-64"
                            />

                            <button
                                onClick={handleSendMessage}
                                disabled={isInputEmpty}
                                className={`p-2 rounded-xl transition-colors duration-300
                           ${isInputEmpty
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    }`}
                                aria-label="Send message"
                            >
                                <Send size={24} />
                            </button>
                        </div>

                        {/* Bottom section with domain selector and other buttons */}
                        <div className="flex items-center justify-between border-t border-gray-200 pt-2 px-2">

                            {/* Domain Selector */}
                            <div className="relative" ref={domainRef}>
                                <button
                                    onClick={() => setShowDomains(!showDomains)}
                                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md bg-white"
                                >
                                    <span className="truncate max-w-[100px] sm:max-w-none">
                                        {currentDomain || "Select domain"}
                                    </span>
                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform duration-200 ${showDomains ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {showDomains && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute bottom-full mb-2 left-0 w-56 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50"
                                    >
                                        {state.domains.map((domain) => (
                                            <div
                                                key={domain.id}
                                                onClick={() => handleDomainSelect(domain.name)}
                                                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors flex items-center space-x-2"
                                            >
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                <span>{domain.name}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </div>



                            {/* Graph Toggle and Attachment buttons */}
                            <div className="flex items-center space-x-2">
                                <GraphViewToggle graphVisibility={graphVisibility} onToggle={toggleGraph} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default PromptContainer;
