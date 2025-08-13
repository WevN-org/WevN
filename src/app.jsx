import { useState } from 'react';
import Sidebar from './components/sidebar';
import GraphViewToggle from './components/graph_toggle';


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
        </div >
    );
};

export default App;
