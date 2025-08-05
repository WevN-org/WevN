import { ApiService } from '../services/apiservice';
import { useEffect, useState } from 'react';
import './styles/sidebar.css';
import { FiSearch, FiArchive, FiTrash } from 'react-icons/fi'; // Feather Icons
import { IoIosAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { useLocation } from 'react-router-dom';
import ManageNodeDialog from './manageNodeDialog';
import ConfirmDeleteDialog from "./confirmDeleteDialog";


export default function Sidebar({ onClick, selectedCollection }) {
    const location = useLocation();
    const [collections, setCollections] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState(null);

    const fetchCollections = async () => {
        try {
            const res = await ApiService.getCollections();
            setCollections(res);
            console.log('📦 Reloaded collections');
        } catch (e) {
            console.log(`❌ Failed to load collections: ${e.message || e}`);
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
            console.log("✅ Collection deleted");

            await fetchCollections(); // reload from backend
            setShowDeleteDialog(false);
            setCollectionToDelete(null);
        } catch (err) {
            console.error("❌ Failed to delete collection", err);
        }
    };

    const handleNewCollection = (data) => {
        console.log("Submitted data:", data);
        // TODO: Add your backend or state update logic here.
        setShowDialog(false); // close it
    };



    return (
        <aside className="sidebar">
            <div>
                <div className="search-bar">
                    <FiSearch size={16} color='#fff' />
                    <input type="text" placeholder="search databases" />
                </div>

                <nav className="database-list">
                    {collections.map((collection) => (
                        <div className='menu-wrapper' key={collection.name}>
                            <div
                                className={`menu-item ${collection.name === selectedCollection ? 'active' : ''}`}
                                onClick={() => onClick(collection.name)}
                            >
                                {collection.name}
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
                </nav>
            </div>

            {
                location.pathname === '/' ? (
                    <div className="sidebar-action" onClick={() => setShowDialog(true)} >
                        <span>Create Collection</span>
                        <IoIosAddCircle size={24} color='#fff' />
                    </div>
                ) : (
                    <div className="sidebar-action">
                        <span>Create Node</span>
                        <IoIosAddCircle size={24} color='#fff' />
                    </div>
                )
            }

            {/* Render dialog at bottom, always part of the component tree */}
            {showDialog && (
                <ManageNodeDialog onSubmit={handleNewCollection} onClose={() => setShowDialog(false)} />
            )}
            {showDeleteDialog && (
                <ConfirmDeleteDialog
                    onConfirm={() => handleCollectionDelete()}
                    onCancel={() => { setShowDeleteDialog(false); setCollectionToDelete(null); }}

                />
            )}
        </aside>
    );
}
