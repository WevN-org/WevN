import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/sidebar';
import QueryView from './components/query_view/query_view'
import ConceptView from './components/concept_view/concept_view';
import LogProvider from './contexts/log-context/log_provider';
import { ApiService } from '../../backend/api-service/api_service.js';
import DomainProvider from './contexts/domain-context/doamin_provider.jsx'
import { useWebSocket } from './custom-hooks/use-websocket.jsx';







// This is the App component that orchestrates everything
const App = () => {


    // --- State Management for the App ---
    const [state, setState] = useState({
        domains: [],
        currentView: 'query', // can be 'query' or 'concept-management'
        sidebarCollapsed: false,
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


    // initial render of the fetchDomain function

    useEffect(() => {
        fetchDomain();
    }, [fetchDomain]);

    // this is the helper function for ws connection and triggers a rerender after every get call currently only triggered when a domain changes
    const onMessage = useCallback((change) => {
        if (change.type === "domain") {
            fetchDomain();
        }
    }, [fetchDomain])

    // -- ws connection -- 
    const wsRef = useWebSocket(onMessage)


    const [activeTab, setActiveTab] = useState('All');
    const [concepts, setConcepts] = useState([
        {
            id: 1,
            title: "What is a closure?",
            description: "A closure is a function bundled together with references to its surrounding state.",
        },
        {
            id: 2,
            title: "React Hooks",
            description: "Functional components can use state and other React features without writing a class.",
        },
        {
            id: 3,
            title: "What are promises?",
            description: "A Promise is a proxy for a value not necessarily known when the promise is created.",
        },
        {
            id: 4,
            title: "Async/Await syntax",
            description: "A modern way to handle asynchronous operations in JavaScript.",
        },
        {
            id: 5,
            title: "What is a closure?",
            description: "A closure is a function bundled together with references to its surrounding state.",
        },
        {
            id: 6,
            title: "React Hooks",
            description: "Functional components can use state and other React features without writing a class.",
        },
        {
            id: 7,
            title: "What are promises?",
            description: "A Promise is a proxy for a value not necessarily known when the promise is created.",
        },
        {
            id: 8,
            title: "Async/Await syntax",
            description: "A modern way to handle asynchronous operations in JavaScript.",
        },
    ]);

    return (
        <>
            <DomainProvider>
                <LogProvider>
                    <div className='flex overflow-hidden'>
                        <Sidebar state={state} setState={setState} />
                        {state.currentView === 'query' ? (
                            <QueryView state={state} setState={setState} />
                        ) : (
                            <ConceptView concepts={concepts} activeTab={activeTab} setActiveTab={setActiveTab} setState={setState} />
                        )}
                    </div >
                </LogProvider>
            </DomainProvider>

        </>
    );
};

export default App;
