import clsx from "clsx";
import { Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { changeDomain } from "../contexts/domain-context/domain_context";
import { ApiService } from "../../../backend/api-service/api_service";
ApiService

const Sidebar = ({ state, setState }) => {

    // -- the currentDomain context --
    const { currentDomain, setDomain } = changeDomain()
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteDomain, setDeleteDomain] = useState(null);
    const [showRenamePopup, setShowRenamePopup] = useState(false);
    const [renameDomain, setRenameDomain] = useState(null);   // the domain being renamed
    const [renameValue, setRenameValue] = useState("");       // input value


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
    const handleDoaminRename = (oldName, newName) => {
        try{
        console.log(`Renaming ${oldName} → ${newName}`);
        ApiService.renameDomain(oldName,newName);
        setShowRenamePopup(false);
        }
        catch(err){
            console.log(err)
        }
    };
    const handleDoaminDelete = (domainName) => {
        try {
            console.log(`domain Delete=> ${domainName}`)
            ApiService.deleteDomain(domainName);
            setDeleteDomain(null);
            setShowDeletePopup(false);
        }
        catch (err) {
            console.log(err)
        }
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
                    //{ collapsed: isCollapsed || sidebarVisibility },
                    { collapsed: isCollapsed },
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
                                        className={clsx(
                                            "flex items-center justify-between p-3 rounded-lg transition duration-200 cursor-pointer",
                                            currentDomain === domain.name
                                                ? "bg-indigo-50 text-indigo-700 font-medium shadow-inner relative before:absolute before:left-5 before:-translate-x-8 before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-5 before:bg-indigo-500 before:rounded-full"
                                                : "text-gray-700 hover:bg-gray-100"
                                        )}
                                        onClick={() => handleDomainClick(domain.name)}
                                    >
                                        <span className={clsx("text-sm", { "pl-2": currentDomain == domain.name })}>{domain.name}</span>
                                        <div className="flex space-x-2">
                                            {/* Rename */}
                                            <button className="text-gray-400 hover:text-blue-500 transition-colors" onClick={() => {
                                                setRenameDomain(domain.name);   // pass the domain to rename
                                                setRenameValue(domain.name);    // prefill input with current name
                                                setShowRenamePopup(true);
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            {/* Delete */}
                                            <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => { setDeleteDomain(domain.name); setShowDeletePopup(true); }}>
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
                        className={`flex items-center justify-center hover:bg-green-100 transition-all duration-200 ease-in-out rounded-md font-medium p-3 whitespace-nowrap bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md ${isCollapsed ? "w-12" : "w-full gap-2"
                            }`}
                    >   <Plus />
                        <span className={` overflow-hidden transition-all duration-200 ease ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"}`}>New Domain</span>
                    </button>
                </div>
                {/* Popup */}
                {showDeletePopup && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-md w-80">
                            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
                            <p className="mb-6">Are you sure you want to delete this item?</p>
                            <div className="flex justify-end gap-4">
                                <button
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                    onClick={() => setShowDeletePopup(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={() => handleDoaminDelete(deleteDomain)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rename Popup */}
                {showRenamePopup && (
                    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30">
                        <div className="bg-white p-6 rounded shadow-md w-80">
                            <h2 className="text-lg font-semibold mb-4">Rename Item</h2>
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new name"
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                    onClick={() => setShowRenamePopup(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    onClick={() => handleDoaminRename(renameDomain, renameValue)}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}


            </aside>
        </div>
    );
};

export default Sidebar;
