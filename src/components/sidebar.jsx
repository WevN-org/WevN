import { collections } from '../../data/collection_data';
import { ApiService } from '../services/apiservice';
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
                            <div className='menu-wrapper'>
                                <div key={collection.name} className={`menu-item ${collection.name === selectedCollection ? 'active' : ''}`} onClick={() => onClick(collection.name)}>
                                    {collection.name}
                                </div>
                                <div className="menu-icons">
                                    <FiArchive size={16} />
                                    <FiTrash size={16} onClick={() => ApiService.deleteCollection(collections.name)} />
                                </div>
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

