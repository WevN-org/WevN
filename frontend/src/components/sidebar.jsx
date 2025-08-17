import clsx from "clsx";
import { Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { changeDomain } from "../contexts/domain-context/domain_context";

const Sidebar = ({ state, setState }) => {

    // -- the currentDomain context --
    const { currentDomain, setDomain } = changeDomain()

    const [sidebarVisibility, setSidebarVisibility] = useState(true)
    const toggleSidebar = () => {
        setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
    };
    const handleDomainClick = (domainName) => {
        setDomain(domainName)

        // the following is to be changed later since the current domain corresponds to the the selectd concept 
        // i kept it here since if no change occur to currentView upon click it wont be displayed this is temprorary 
        setState(prev => ({
            ...prev,
            currentView: 'concept'
        }));
    };

    const isCollapsed = state.sidebarCollapsed;
    const hasDomains = state.domains?.length > 0;

    return (
        <div className="sidebar-wrapper relative z-50 bg-green-500 transition-colors duration-500 h-dvh">
            <div className="sidebar-toggle-button flex justify-end pr-3 absolute top-3 -right-3 translate-x-12 transition-all duration-500 w-20 h-15 rounded-full"
                onClick={() => setSidebarVisibility(!sidebarVisibility)}
            >
                <button className="text-gray-600">
                    {sidebarVisibility ? <PanelLeftOpen size={28} /> : <PanelLeftClose size={28} />}
                </button>
            </div>

            {/*! don't remove - can be used to make toggle button visible on hover */}
            {/*<div
                className={clsx("hover-box absolute top-0 left-0 h-full z-30 hover:bg-amber-100",
                    { collapsed: isCollapsed || sidebarVisibility },
                    { hide: sidebarVisibility },
                )}
            />*/}

            <aside
                id="sidebar"
                className={clsx(
                    "sidebar relative  h-screen flex-col border-r border-gray-200 md:flex transition-all duration-500 p-2 z-40",
                    { collapsed: isCollapsed || sidebarVisibility },
                    { hide: sidebarVisibility },
                )}
            >
                {/* Sidebar Header */}
                <button
                    id="toggle-sidebar-btn"
                    className={clsx(
                        "flex items-center justify-between w-full cursor-pointer p-4 rounded-lg transition-colors duration-200 hover:bg-gray-100",
                        { collapsed: isCollapsed }
                    )}
                    onDoubleClick={toggleSidebar}
                    onClick={() => console.log("accounts page")} // ? TODO create AccountView
                >
                    {!isCollapsed && !sidebarVisibility && (
                        <h1 className="text-3xl font-extrabold text-gray-800">WevN</h1>
                    )}
                    <img src="/logo.png" alt="WevN Logo" className="h-8 mr-2" />
                </button>

                {/* Collapsed Search Button */}
                {isCollapsed && (
                    <button
                        id="collapsed-search-btn"
                        className="my-4 mx-auto w-12 h-12 flex items-center justify-center text-gray-500 hover:text-blue-500 rounded-lg transition-colors duration-200 border border-gray-300"
                        onClick={toggleSidebar}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                )}

                {/* Domain Management */}
                {!isCollapsed && (
                    <div id="domain-management-container" className="p-4">
                        {/* active Search Bar */}
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Search domains..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Domain List */}
                        {hasDomains ? (
                            <ul className={clsx("domain-list space-y-2 overflow-y-scroll max-h-3/4", { hide: sidebarVisibility })}>
                                {state.domains.map(domain => (
                                    <li
                                        tabIndex={0}
                                        key={domain.id}
                                        className="flex items-center justify-between p-3 rounded-lg border-l-4 border-l-transparent transition-colors duration-200 cursor-pointer focus:bg-gray-200 focus:border-l-green-500"
                                        onClick={() => handleDomainClick(domain.name)}
                                    >
                                        <span className="text-sm font-medium text-gray-700">{domain.name}</span>
                                        <div className="flex space-x-2">
                                            {/* Rename */}
                                            <button className="text-gray-400 hover:text-blue-500 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            {/* Delete */}
                                            <button className="text-gray-400 hover:text-red-500 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 opacity-60 z-50">
                                <p className="text-center">No existing domains found!</p>
                                <button className="text-blue-500 hover:text-blue-600 transition-colors text-sm font-medium mt-2">
                                    + create new ?
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* New Domain Button */}
                <div className="bg-white flex absolute w-[calc(100%-1rem)] bottom-0 justify-center mt-auto border-t-2 border-gray-200 p-3">
                    <button
                        className={`flex items-center justify-center  text-green-500 hover:bg-green-100 hover:text-black transition-all duration-200 ease-in-out outline-2 outline-green-500 rounded-md font-medium p-3 whitespace-nowrap ${isCollapsed ? "w-12" : "w-full gap-2"
                            }`}
                    >   <Plus />
                        <span className={` overflow-hidden transition-all duration-200 ease ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"}`}>New Domain</span>
                    </button>
                </div>

            </aside>
        </div>
    );
};

export default Sidebar;
