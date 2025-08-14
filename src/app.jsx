import { useState } from 'react';
import Sidebar from './components/sidebar';
import QueryView from './components/query_view/query_view'
import ConceptView from './components/concept_view/concept_view';


// This is the App component that orchestrates everything
const App = () => {
    // --- State Management for the App ---
    const [state, setState] = useState({
        domains: [
            { id: 1, name: 'Personal Knowledge' },
            { id: 2, name: 'Project A Documentation' },
            { id: 3, name: 'Fyndr Bot' },
        ],
        currentView: 'query', // can be 'query' or 'concept-management'
        sidebarCollapsed: false,
        selectedDomainId: null,
    });

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
        <div className='flex overflow-hidden'>
            <Sidebar state={state} setState={setState} />
            {state.currentView === 'query' ? (
                <QueryView state={state} setState={setState} />
            ) : (
                <ConceptView concepts={concepts} activeTab={activeTab} setActiveTab={setActiveTab} setState={setState} />
            )}
        </div >
    );
};

export default App;
