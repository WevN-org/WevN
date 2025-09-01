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
    const { currentDomain, setDomain } = changeDomain();
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
