import { useCallback, useState, useEffect, useRef } from 'react';
import Sidebar from './components/sidebar';
import QueryView from './components/query_view/query_view'
import ConceptView from './components/concept_view/concept_view';
import LogProvider from './contexts/log-context/log_provider';
import { ApiService } from '../../backend/api-service/api_service.js';
import { useWebSocket } from './custom-hooks/use-websocket.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNodes } from './contexts/nodes-context/nodes_context.jsx';
import { useDomain } from './contexts/domain-context/domain_context.jsx';




// This is the App component that orchestrates everything
const App = () => {

    const { setNodes } = useNodes();
    const { currentDomain } = useDomain();
    // --- State Management for the App ---
    const [state, setState] = useState({
        domains: [],
        currentView: 'query', // can be 'query' or 'concept-management'
        sidebarCollapsed: false,
        messages: [
            { role: "assistant", content: "Hi! Ask me anything about your knowledgebase." }
        ],
    });



    // -- function to fetch domains using ApiService --

    const fetchDomain = useCallback(
        async () => {
            try {
                const result = await ApiService.getDomain();
                setState(
                    (prev) => ({
                        ...prev,
                        domains: result
                    })
                )
            }
            catch (err) {
                console.log(err)
            }
        }, []);


    const fetchNodes = useCallback(
        async () => {
            try {
                if (currentDomain) {
                    console.log(currentDomain)
                    const nodes = await ApiService.listNode(currentDomain);
                    setNodes(nodes);
                }

            }
            catch (err) {
                console.log(err)
            }
        }, [currentDomain]);

    // initial render of the fetchDomain function
    const fetchNodesRef = useRef(fetchNodes);
    const fetchDomainRef = useRef(fetchDomain);
    const firstLoad = useRef(true);

    useEffect(() => {
        fetchDomainRef.current = fetchDomain
        fetchNodesRef.current = fetchNodes
    }, [fetchNodes, fetchDomain]);

    useEffect(() => {
        if (!firstLoad.current) {
            fetchNodesRef.current()
        }
    }, [fetchNodes])
    // this is the helper function for ws connection and triggers a rerender after every get call currently only triggered when a domain changes
    const onMessage = useCallback((change) => {

        if (change === "domain" || change === "reload") {
            fetchDomainRef.current();
        }
        if (change === "node" || change === "reload") {
            fetchNodesRef.current()
            firstLoad.current = false
        }
    }, [])

    // -- ws connection -- 
    const wsRef = useWebSocket(onMessage)


    const [activeTab, setActiveTab] = useState('All');

    return (
        <>
            <LogProvider>
                <div className='flex overflow-hidden h-screen'>
                    <Sidebar state={state} setState={setState} />
                    {state.currentView === 'query' ? (
                        <QueryView state={state} setState={setState} />
                    ) : (
                        <ConceptView activeTab={activeTab} setActiveTab={setActiveTab} setState={setState} currentDomain={currentDomain} />
                    )}
                </div >
            </LogProvider>
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                newestOnTop={true}
                closeOnClick
                pauseOnHover
                draggable
            />
        </>
    );
};

export default App;
