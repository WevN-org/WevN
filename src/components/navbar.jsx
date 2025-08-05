import GraphToggle from './graph_toggle';
import './styles/navbar.css'
import { Link, useLocation } from 'react-router-dom';
import { useCollection } from '../context/CollectionContext';

export default function Navbar() {
    const location = useLocation();
    const {currentCollection}=useCollection();

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <span className="logo">WevN</span>

                <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
                <Link to="/graph" className={`nav-item ${location.pathname === '/graph' ? 'active' : ''}`}>Graph</Link>
                <Link to="/nodes" className={`nav-item ${location.pathname === '/nodes' ? 'active' : ''}`}>Nodes</Link>
            </div>

            <div className="navbar-right">

                <h2>{currentCollection==="" ? ";)" : currentCollection}</h2>

                <div className="avatar">A</div>
            </div>
        </nav>
    );
}
