import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/sidebar';
import QueryView from './components/query_view/query_view'
import ConceptView from './components/concept_view/concept_view';
import LogProvider from './contexts/log-context/log_provider';
import { ApiService } from '../../backend/api-servide/api_service.js';
import DomainProvider from './contexts/domain-context/doamin_provider.jsx'







// This is the App component that orchestrates everything
const App = () => {

    // -- state for the selected domain -- (since every component uses it (every api request) and for the necessity of a local storage)


    // --- State Management for the App ---
    const [state, setState] = useState({
        //domains: [
        //    { "id": "impl-001", "name": "Introduction to RAG" },
        //    { "id": "impl-002", "name": "Haystack Framework" },
        //    { "id": "impl-003", "name": "Wikipedia Embeddings" },
        //    { "id": "impl-004", "name": "Vector Databases Overview" },
        //    { "id": "impl-005", "name": "LangChain Framework" },
        //    { "id": "impl-006", "name": "Document Retrieval Pipeline" },
        //    { "id": "impl-007", "name": "Semantic Search Module" },
        //    { "id": "impl-008", "name": "QA System Template" },
        //    { "id": "impl-009", "name": "Knowledge Graph Integration" },
        //    { "id": "impl-010", "name": "Preprocessing Scripts" },
        //    { "id": "impl-011", "name": "Chunking Strategies" },
        //    { "id": "impl-012", "name": "Embedding Models" },
        //    { "id": "impl-013", "name": "Vector Store Connectors" },
        //    { "id": "impl-014", "name": "Re-ranking Mechanisms" },
        //    { "id": "impl-015", "name": "Query Expansion" },
        //    { "id": "impl-016", "name": "Context Window Management" },
        //    { "id": "impl-017", "name": "Caching Layer" }
        //],
        currentView: 'query', // can be 'query' or 'concept-management'
        sidebarCollapsed: false,
    });



    // -- function to fetch domains using ApiService --
    // I have made it a separate function since this function needs to be called upon creating a new domain(may be a dependancy update ?)


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
