import { useState } from 'react';
import Sidebar from './components/sidebar';

// This is the App component that orchestrates everything
const App = () => {
    // --- State Management for the App ---
    const [state, setState] = useState({
        domains: [
            { id: 1, name: 'Personal Knowledge' },
            { id: 2, name: 'Project A Documentation' },
        ],
        currentView: 'query', // can be 'query' or 'concept-management'
        sidebarCollapsed: false,
        selectedDomainId: null,
    });

    return (
        <div>
            <Sidebar state={state} setState={setState} />
        </div>
    );
};

export default App;
