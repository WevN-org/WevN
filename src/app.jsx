import { useState } from 'react';
import Sidebar from './components/sidebar';

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

    const [sidebarVisibility, setSidebarVisibility] = useState(true)

    return (
        <div className='flex h-screen'>
            {sidebarVisibility && <Sidebar state={state} setState={setState} />}
            <main className='main-content'>
                {/* <!-- Mobile Sidebar Toggle --> */}
                <button id="mobile-sidebar-toggle" onClick={() => setSidebarVisibility(!sidebarVisibility)}
                    class="md:hidden p-4 text-gray-500 hover:text-gray-700 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </main>
        </div>
    );
};

export default App;
