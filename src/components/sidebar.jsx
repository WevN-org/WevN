import './styles/sidebar.css';
import { FiSearch, FiArchive } from 'react-icons/fi'; // Feather Icons


export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div>
                <div className="search-bar">
                    <FiSearch size={16} color='#000' />
                    <input type="text" placeholder="search databases" />
                </div>

                <nav className="database-list">
                    <div className="db-item">Lawy</div>
                    <div className="db-item active">Fyndr</div>
                    <div className="db-item">Uninotes</div>
                    <div className="db-item">Classbook</div>
                </nav>
            </div>

            <div className="archive-bar">
                <span>Archive</span>
                <FiArchive size={16} />
            </div>
        </aside>
    );
}
