import clsx from "clsx";
import { Plus, PanelLeftClose, PanelLeftOpen, Search, FilePenLine, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { changeDomain } from "../contexts/domain-context/domain_context";
import { ApiService } from "../../../backend/api-service/api_service";
import { toast } from "react-toastify";

const Sidebar = ({ state, setState }) => {


    const { currentDomain, setDomain } = changeDomain();
    // -- the currentDomain context --
    // console.log(`current: ${currentDomain}`)
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteDomain, setDeleteDomain] = useState(null);
    const [showRenamePopup, setShowRenamePopup] = useState(false);
    const [renameDomain, setRenameDomain] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [newDomain, setNewDomain] = useState("");
    const [query, setQuery] = useState("");

    // This is the state variable you were using to manage visibility
    const [sidebarVisibility, setSidebarVisibility] = useState(true);

    const filteredDomains = useMemo(() => {
        return state.domains?.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
    }, [state.domains, query]);

    const isCollapsed = state.sidebarCollapsed;
    const hasDomains = state.domains?.length > 0;

    const toggleSidebar = () => {
        setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
    };

    const handleDomainClick = (domainName) => {
        setDomain(domainName);
        setState(prev => ({
            ...prev,
            currentView: 'query'
        }));
    };

    const handleDomainDblClick = () => {
        setState(prev => ({
            ...prev,
            currentView: 'concept'
        }));
    };

    // The different errors are not handled. just a common catch block is used

    const handleDomainRename = async (oldName, newName) => {
        try {
            toast.success(`${oldName} renamed to ${newName} successfully.`);
            await ApiService.renameDomain(oldName, newName);
            setShowRenamePopup(false);
        } catch {
            toast.error("Failed to rename domain. Please try again.");
        }
    };

    const handleDomainDelete = async (domainName) => {
        try {
            toast.info(`${domainName} deleted successfully.`);
            await ApiService.deleteDomain(domainName);
            setDeleteDomain(null);
            setShowDeletePopup(false);
        } catch {
            toast.error("Failed to delete domain. Please try again.");
        }
    };

    const handleCreateDomain = async (domainName) => {
        try {
            await ApiService.createDomain(domainName);
            toast.success(`${domainName} created successfully.`);
            setShowCreatePopup(false);
            setNewDomain("");
        } catch {
            toast.error("Failed to create domain. Please try again.");
        }
    };

    return (
        <div className="sidebar-wrapper relative z-50 bg-green-500 transition-colors duration-500 h-dvh">
            {/* Sidebar toggle button that controls local visibility state */}
            <div
                className="sidebar-toggle-button flex justify-end pr-3 absolute top-3 -right-3 translate-x-12 transition-all duration-500 w-20 h-15 rounded-full"
                onClick={() => setSidebarVisibility(!sidebarVisibility)}
            >
                <button className="text-gray-600">
                    {sidebarVisibility ? <PanelLeftOpen size={28} /> : <PanelLeftClose size={28} />}
                </button>
            </div>

            <aside
                id="sidebar"
                className={clsx(
                    "sidebar relative h-screen flex-col border-r border-gray-200 md:flex transition-all duration-500 p-2 z-40",
                    { collapsed: isCollapsed },
                    { hide: sidebarVisibility },
                )}
            >
                {/* Sidebar Header */}
                <button
                    id="toggle-sidebar-btn"
                    className={clsx(
                        "flex items-center  w-full cursor-pointer rounded-lg transition-colors duration-200 hover:bg-gray-100",
                        { 'justify-between p-4': !isCollapsed },
                        { 'collapsed p-0 justify-center': isCollapsed }
                    )}
                    onDoubleClick={toggleSidebar} // This double-click still controls the parent state
                    onClick={() => console.log("accounts page")}
                >
                    {!isCollapsed && !sidebarVisibility && (
                        <h1 className="text-3xl font-extrabold text-gray-800">WevN</h1>
                    )}
                    <img src="https://randomuser.me/api/portraits/men/33.jpg" alt="WevN Logo" className={clsx('h-10 rounded-full', { 'mr-2 h-8': !isCollapsed })} />
                </button>

                {/* Collapsed Search Button */}
                {isCollapsed && (
                    <button
                        id="collapsed-search-btn"
                        className="my-4 mx-auto w-12 h-12 flex items-center justify-center text-gray-500 hover:text-blue-500 rounded-lg transition-colors duration-200 border border-gray-300"
                        onClick={toggleSidebar}
                    >
                        <Search className="h-6 w-6" />
                    </button>
                )}

                {/* Domain Management */}
                {!isCollapsed && (
                    <div id="domain-management-container" className="p-4">
                        {/* Active Search Bar */}
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Search domains..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>

                        {/* Domain List */}
                        {(filteredDomains.length === 0 && query) || !hasDomains ? (
                            <div className="flex flex-col items-center text-gray-400 opacity-60 z-50">
                                <p className="text-center">No domains found!</p>
                                <button
                                    className="text-blue-500 hover:text-blue-600 transition-colors text-sm font-medium mt-2"
                                    onClick={() => setShowCreatePopup(true)}
                                >
                                    + create new ?
                                </button>
                            </div>
                        ) : (
                            <ul className="domain-list space-y-2 overflow-y-scroll max-h-[60vh]">
                                {filteredDomains.map(domain => (
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
                                        onDoubleClick={handleDomainDblClick}
                                    >
                                        <span className={clsx("text-sm", { "pl-2": currentDomain === domain.name })}>{domain.name}</span>
                                        <div className="flex space-x-2">
                                            {/* Rename */}
                                            <button
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRenameDomain(domain.name);
                                                    setRenameValue(domain.name);
                                                    setShowRenamePopup(true);
                                                }}
                                            >
                                                <FilePenLine className="h-4 w-4" />
                                            </button>
                                            {/* Delete */}
                                            <button
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteDomain(domain.name);
                                                    setShowDeletePopup(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* New Domain Button */}
                <div className="bg-white flex absolute w-[calc(100%-1rem)] bottom-0 justify-center mt-auto border-t-2 border-gray-200 p-3">
                    <button
                        className={`flex items-center justify-center hover:bg-green-100 transition-all duration-200 ease-in-out rounded-md font-medium p-3 whitespace-nowrap bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md ${isCollapsed ? "w-12" : "w-full gap-2"}`}
                        onClick={() => setShowCreatePopup(true)}
                    >
                        <Plus />
                        <span className={`overflow-hidden transition-all duration-200 ease ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"}`}>New Domain</span>
                    </button>
                </div>

                {/* Popup for Delete */}
                {showDeletePopup && (
                    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30">
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
                                    onClick={() => handleDomainDelete(deleteDomain)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Popup for Rename */}
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
                                    onClick={() => handleDomainRename(renameDomain, renameValue)}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Popup for Create */}
                {showCreatePopup && (
                    <div className="fixed inset-0 flex items-center justify-center bg-white/30 bg-opacity-40 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded shadow-md w-96">
                            <h2 className="text-lg font-semibold mb-4">Create New Domain</h2>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Enter domain name"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                    onClick={() => setShowCreatePopup(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                    onClick={() => handleCreateDomain(newDomain)}
                                >
                                    Create
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