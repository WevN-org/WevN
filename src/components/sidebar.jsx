import { useState, useRef, useEffect } from 'react';

const Sidebar = ({ state, setState }) => {
    const sidebarRef = useRef(null);
    const appTitleRef = useRef(null);
    const domainManagementContainerRef = useRef(null);
    const sidebarPlaceholderRef = useRef(null);
    const accountLinkRef = useRef(null);
    const accountTextRef = useRef(null);
    const newDomainBtnRef = useRef(null);

    const toggleSidebar = () => {
        setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
    };

    useEffect(() => {
        const sidebar = sidebarRef.current;
        const appTitle = appTitleRef.current;
        const domainManagementContainer = domainManagementContainerRef.current;
        const sidebarPlaceholder = sidebarPlaceholderRef.current;
        // const newDomainBtn = newDomainBtnRef.current;
        const toggleBtn = document.getElementById('toggle-sidebar-btn');
        const collapsedSearchBtn = document.getElementById('collapsed-search-btn');

        if (state.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
            appTitle.classList.add('hidden');
            domainManagementContainer.classList.add('hidden');
            sidebarPlaceholder.classList.add('hidden');
            if (collapsedSearchBtn) collapsedSearchBtn.classList.remove('hidden');

        } else {
            sidebar.classList.remove('collapsed');
            toggleBtn.classList.remove('collapsed');
            appTitle.classList.remove('hidden');
            domainManagementContainer.classList.remove('hidden');
            sidebarPlaceholder.classList.remove('hidden');
            if (collapsedSearchBtn) collapsedSearchBtn.classList.add('hidden');
        }
    }, [state.sidebarCollapsed]);


    // Placeholder for rendering domains
    const renderDomains = () => {
        return state.domains.map(domain => (
            <li
                key={domain.id}
                className="flex items-center justify-between p-3 rounded-lg transition-colors duration-200 cursor-pointer bg-gray-100"
            >
                <span className="text-sm font-medium text-gray-700">{domain.name}</span>
                <div className="flex space-x-2">
                    {/* rename icon */}
                    <button className="text-gray-400 hover:text-blue-500 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    {/* delete icon */}
                    <button className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </li>
        ));
    };

    return (
        <aside id="sidebar" ref={sidebarRef} className="sidebar h-screen flex-col border-r border-gray-200 md:flex">
            {/* Sidebar Header */}
            <button id="toggle-sidebar-btn" className="flex items-center justify-between w-full cursor-pointer p-4 rounded-lg transition-colors duration-200 hover:bg-gray-100" onClick={toggleSidebar}>
                <h1 id="app-title" ref={appTitleRef} className="text-3xl font-extrabold text-gray-800 transition-opacity duration-300">WevN</h1>
                <img src="/logo.png" alt="WevN Logo" className="h-8 mr-2" />
            </button>
            <button id="collapsed-search-btn" className="hidden my-4 mx-auto w-12 h-12 flex items-center justify-center text-gray-500 hover:text-blue-500 rounded-lg transition-colors duration-200 border border-gray-300" onClick={toggleSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            {/* Domain Management */}
            <div id="domain-management-container" ref={domainManagementContainerRef} className="p-4">

                <div className="relative mb-4">
                    <input type="text" id="domain-search" placeholder="Search domains..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <ul id="domain-list" className="space-y-2 custom-scrollbar overflow-y-auto max-h-[300px]">
                    {renderDomains()}
                </ul>
            </div>

            {/* Placeholder for no domains */}
            <div id="sidebar-placeholder" ref={sidebarPlaceholderRef} className="flex flex-col items-center text-gray-400 opacity-60">
                <p className="text-center">No existing domains found!</p>
                <button className="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium mt-2">
                    + create new ?
                </button>
            </div>

            <div className="flex justify-center mt-auto p-3 border-t-2 border-gray-200">
                {state.sidebarCollapsed ?
                    (
                        <button id="new-domain-btn" className="text-blue-500 hover:text-blue-600 transition-colors outline p-[var(--padding-card)] rounded-md duration-200 text-sm font-medium">
                            +
                        </button>
                    ) :
                    (
                        <button id="new-domain-btn" className="text-blue-500 hover:text-blue-600 transition-colors duration-200 outline p-[var(--padding-card)] rounded-md text-sm font-medium">
                            + New Domain
                        </button>
                    )}

            </div>
        </aside>
    );
};

export default Sidebar;
