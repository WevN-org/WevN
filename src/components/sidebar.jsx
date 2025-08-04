import { collections } from '../../data/collection_data';
import './styles/sidebar.css';
import { FiSearch, FiArchive, FiTrash } from 'react-icons/fi'; // Feather Icons


export default function Sidebar({ onClick, selectedCollection }) {
    return (
        <aside className="sidebar">
            <div>
                <div className="search-bar">
                    <FiSearch size={16} color='#fff' />
                    <input type="text" placeholder="search databases" />
                </div>

                <nav className="database-list">
                    {
                        collections.map(collection => (
                            <div key={collection.name} className={`menu-item ${collection.name === selectedCollection ? 'active' : ''}`} onClick={() => onClick(collection.name)}>
                                {collection.name}
                                <FiTrash size={16} />
                            </div>
                        ))
                    }
                </nav>
            </div>

            <div className="archive-bar">
                <span>Archive</span>
                <FiArchive size={16} color='#fff' />
            </div>
        </aside>
    );
}

