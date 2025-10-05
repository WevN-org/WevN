import { useState } from "react";
import GraphContainer from "./graph_container";
import PromptContainer from "./prompt_container";
import ChatMessages from "./chat_messages";
import clsx from "clsx";
import { Trash2, Plus, Sparkles, X, Loader2, AlertCircle } from 'lucide-react';
import { ApiService } from "../../../../backend/api-service/api_service";
import { useDomain } from "../../contexts/domain-context/domain_context";
import { useMessages } from "../../contexts/message-context/message_context";
import { useLinks } from "../../contexts/link-context/link_context";
import { toast } from "react-toastify";
import { useRagList } from "../../contexts/rag-list-context/rag_list_context";



export default function QueryView({ state, setState }) {
    const [graphVisibility, setGraphVisibility] = useState(true);
    // expand graph view
    const [chatVisibiilty, setChatVisibility] = useState(false);

    const toggleGraphView = () => setGraphVisibility((prev) => !prev);
    const toggleChatWindow = () => setChatVisibility((prev) => !prev);
    

    return (
        <main
            id="query-view"
            className={clsx(
                "main-content relative h-screen flex flex-col md:flex-row",
                {
                    "justify-center w-full": graphVisibility,
                    "w-full": !graphVisibility,
                }
            )}
        >
            {/* Graph */}
            <GraphContainer isVisible={graphVisibility} isChatVisible={!chatVisibiilty} toggleChatWindow={toggleChatWindow} className="w-full md:w-[40%] h-64 md:h-auto md:order-last" />

            {/* Chat */}
            <div
                id="chat-window"
                className={clsx(
                    "relative flex flex-col h-full order-last md:order-first transition-all duration-500",
                    { "flex-grow": !graphVisibility },
                    { 'w-0 flex-0 opacity-0': chatVisibiilty },
                    { 'flex-1': !chatVisibiilty }
                )}
            >
                <ModernHeader graphVisibility={graphVisibility} />
                <ChatMessages graphVisibility={graphVisibility} />   {/* use state.messages */}
                <PromptContainer
                    graphVisibility={graphVisibility}
                    toggleGraph={toggleGraphView}
                    setState={setState}   // no need to pass full state
                />
            </div>
        </main>
    );
}

function ModernHeader({ graphVisibility }) {
    const [showNodeModal, setShowNodeModal] = useState(false);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [onSuccess, setSuccess] = useState(false);
    const { currentDomain } = useDomain();
    const { clearMessages, activeDomainId } = useMessages();
    const { domainLinks } = useLinks();
    const [statusString, setStatusString] = useState()
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const { setRagList } = useRagList();
    // console.log("dm: ",domainLinks[activeDomainId])

    const handleClearChat = async () => {
        if (!activeDomainId) {
            toast.warn("No active domain selected to clear.");
            return;
        }
        setShowClearConfirm(true);

    };

    const clearChat = async () => {
        try {
            clearMessages(activeDomainId);
            await ApiService.clearMemory(activeDomainId);
            toast.success("Chat history has been cleared.");
        } catch (err) {
            console.log(err);
            toast.error(`${err}`);
        } finally {
            setShowClearConfirm(false);
        }
    }

    const handleCreateNode = async () => {
        if (!query.trim() || !currentDomain || !activeDomainId || !domainLinks) return;

        setIsLoading(true);
        setError(false);

        try {
            //call node create api here 

            const newNode = await ApiService.autoCreateNode(
                currentDomain,
                activeDomainId,
                query,
                domainLinks[activeDomainId].max_links,
                domainLinks[activeDomainId].distance_threshold

            )
            // await new Promise((resolve, reject) => {
            //     setTimeout(() => {
            //         // Randomly succeed or fail for demo
            //         Math.random() > 0.3 ? resolve() : reject();
            //     }, 2000);
            // });

            // Success - close modal and reset
            // setShowNodeModal(false); // enable if need autoclose
            setRagList([newNode.id  ])
            setStatusString(`Node ${newNode.name} created successfully!`)
            toast.success(`Node ${newNode.name} created successfully!`);
            setSuccess(true);
            setQuery('');
            setIsLoading(false);

            // Hide onSuccess message after 3 seconds
            // setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            // Failure - show retry
            toast.error(`${err}`)
            setError(true);
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        // just resetting all states
        setShowNodeModal(false);
        setQuery('');
        setError(false);
        setIsLoading(false);
        setSuccess(false);
    };

    return (
        <>
            <div className={clsx("sticky top-0 left-0 right-0 z-10 ", {
                "w-3/4 mx-auto ": !graphVisibility,
            })}>
                {/* Glassmorphic header with gradient border */}
                <div className="relative backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-2xl shadow-lg shadow-gray-200/50">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-2xl pointer-events-none" />

                    {/* Content */}
                    <div className={clsx("relative flex justify-between items-center p-5", {
                        'flex-col space-y-5': graphVisibility
                    })}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900 text-lg tracking-tight">WeavBot</h1>
                                <p className="text-xs text-gray-500">AI Assistant</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearChat}
                                className="group flex items-center gap-2 px-2 py-1.5 bg-gradient-to-br from-red-50 to-red-100/50 text-red-600 rounded-xl border border-red-200/50 shadow-sm hover:shadow-md hover:from-red-100 hover:to-red-200/50 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                            >
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                <span className="text-sm">Clear</span>
                            </button>

                            <button
                                onClick={() => setShowNodeModal(true)}
                                className="group flex items-center gap-2 px-2 py-1.5 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-xl shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                                <span className="text-sm">Create Node</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* ... inside the return statement of ModernHeader, after the main header div */}

            {/* Confirmation Popup for Clearing Chat */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-gray-900/20 animate-in zoom-in-95 duration-200">
                        {/* Red accent bar for destructive action */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-yellow-500 rounded-t-2xl" />

                        {/* Modal header */}
                        <div className="flex items-start justify-between p-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                                    <AlertCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Clear Chat History</h2>
                                    <p className="text-xs text-gray-500">This action cannot be undone.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 pb-6">
                            <p className="text-sm text-gray-600 mb-6">
                                Are you sure you want to permanently delete all messages for the "<strong>{currentDomain}</strong>" domain?
                            </p>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={clearChat}
                                    className="flex-1 px-4 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-medium shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    Yes, Clear History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showNodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-gray-900/20 animate-in zoom-in-95 duration-200">
                        {/* Gradient accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                    <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Create New Node</h2>
                                    <p className="text-xs text-gray-500">Enter your query below</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                disabled={isLoading}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 pb-6">
                            <div className="space-y-4">
                                {/* Text field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Query
                                    </label>
                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        disabled={isLoading}
                                        placeholder="Enter your query here..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-2 duration-200">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-sm text-red-700">Failed to create node. Please try again.</p>
                                    </div>
                                )}

                                {/* Success message */}
                                {onSuccess && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-200">
                                        <Sparkles className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <p className="text-sm text-green-700">{statusString}</p>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleCloseModal}
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateNode}
                                        disabled={isLoading || !query.trim()}
                                        className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Creating...</span>
                                            </>
                                        ) : error ? (
                                            <>
                                                <AlertCircle className="w-5 h-5" />
                                                <span>Retry</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5" strokeWidth={2.5} />
                                                <span>Create</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}