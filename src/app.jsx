import { useState } from 'react';
import Sidebar from './components/sidebar';
import QueryView from './components/query_view/query_view'


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

    return (
        <div className='flex'>
            <Sidebar state={state} setState={setState} />
            <QueryView state={state} setState={setState} />
        </div >
    );
};

export default App;
