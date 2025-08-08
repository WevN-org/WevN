import { ApiService } from '../services/apiservice';
import { useEffect, useState } from 'react';
import '../styles/component_styles/sidebar.css';
import { FiSearch } from 'react-icons/fi'; // Feather Icons
import { IoIosAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { useLocation } from 'react-router-dom';
import ManageNodeDialog from './manageNodeDialog';
import ConfirmDeleteDialog from "./confirmDeleteDialog";
import CreateCollectionDialog from './createCollectionDialog';
import { useLog } from '../context/LogContext';

export default function Sidebar({ onClick, selectedCollection }) {
    const location = useLocation();
    const { addLog } = useLog();

    const [collections, setCollections] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [shownewCollectionDialog, setshownewCollectionDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState(null);

    // !---TEMP---

    const [groupedNodes, setGroupedNodes] = useState({
        Favourites: [],
        History: [],
    });

    const [openSections, setOpenSections] = useState({
        Favourites: true,
        History: false,
    });

    useEffect(() => {
        if (location.pathname !== '/') {
            // Temporary mock data, replace with actual API call
            setGroupedNodes({
                Favourites: [
                    { id: '1', name: 'Node A' },
                    { id: '2', name: 'Node B' },
                ],
                History: [
                    { id: '3', name: 'Node C' },
                    { id: '4', name: 'Node D' },
                ],
            });
        }
    }, [location.pathname]);

    // !--TEMP--

    const fetchCollections = async () => {
        try {
            const res = await ApiService.getCollections();
            setCollections(res);
            addLog('📦 Reloaded collections');
        } catch (e) {
            addLog(`❌ Failed to load collections: ${e.message || e}`);
        }
    };

    // Fetch once on mount
    useEffect(() => {
        fetchCollections();
    }, []);

    const handleCollectionDelete = async () => {
        if (!collectionToDelete) return;

        try {
            await ApiService.deleteCollection(collectionToDelete);
            addLog("✅ Collection deleted");

            await fetchCollections(); // reload from backend
            setShowDeleteDialog(false);
            setCollectionToDelete(null);
        } catch (err) {
            addLog("❌ Failed to delete collection", err);
        }
    };

    const handleNewCollection = (data) => {
        addLog("Submitted data:", data);
        // TODO: Add your backend or state update logic here.
        setShowDialog(false); // close it
    };

    return (
        <aside className="sidebar">
            <div>
                <div className="search-bar">
                    <FiSearch size={16} color='#fff' />
                    <input type="text" placeholder={`search ${location.pathname === '/' ? 'databases' : 'Nodes'} `} />
                </div>

                {
                    location.pathname === '/' ?
                        <nav className="database-list">
                            {collections.map((collection) => (
                                // ! set a different key for each collection
                                <div className='menu-wrapper' key={collection.name}>
                                    <div
                                        className={`menu-item ${collection.name === selectedCollection ? 'active' : ''}`}
                                        onClick={() => onClick(collection.name)}
                                    >
                                        <span> {collection.name}</span>
                                    </div>
                                    <div className="menu-icons">
                                        <div className="menu-icons__delete">
                                            <MdDelete color='#fff' onClick={() => {
                                                setCollectionToDelete(collection.name);

                                                setShowDeleteDialog(true)
                                            }} />
                                        </div>
                                    </div>

                                </div>

                            ))}
                        </nav> :
                        (
                            <nav className="database-list">
                                {Object.entries(groupedNodes).map(([section, nodes]) => (
                                    <div className="group-section" key={section}>
                                        <div
                                            className="group-header"
                                            onClick={() =>
                                                setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
                                            }
                                        >
                                            <span>{section}</span>
                                            <span>{openSections[section] ? '▼' : '▶'}</span>
                                        </div>

                                        {openSections[section] && (
                                            <div className="group-nodes">
                                                {nodes.map((node) => (
                                                    <div
                                                        key={node.id}
                                                        className="menu-item"
                                                        onClick={() => console.log("Clicked node:", node)}
                                                    >
                                                        {node.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        )
                }
            </div>

            {
                location.pathname === '/' ? (
                    <div className="sidebar-action" onClick={() => setshownewCollectionDialog(true)} >
                        <span>Create Collection</span>
                        <IoIosAddCircle size={24} color='#fff' />
                    </div>
                ) : (
                    <div className="sidebar-action" onClick={() => setShowDialog(true)}>
                        <span>Create Node</span>
                        <IoIosAddCircle size={24} color='#fff' />
                    </div>
                )
            }

            {/* Render dialog at bottom, always part of the component tree */}
            {showDialog && (
                <ManageNodeDialog onSubmit={handleNewCollection} onClose={() => setShowDialog(false)} collectionOptions={collections.map(c => c.name)} />
            )}
            {showDeleteDialog && (
                <ConfirmDeleteDialog
                    onConfirm={() => handleCollectionDelete()}
                    onCancel={() => { setShowDeleteDialog(false); setCollectionToDelete(null); }}

                />
            )}
            {shownewCollectionDialog && (
                <CreateCollectionDialog
                    onSubmit={(data) => {
                        console.log("New collection data:", data);
                    }}
                    onClose={() => setshownewCollectionDialog(false)} />
            )}
        </aside>
    );
}
