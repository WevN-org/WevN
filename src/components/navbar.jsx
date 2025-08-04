import GraphToggle from './graph_toggle';
import './styles/navbar.css'
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <span className="logo">WevN</span>

                <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
                <Link to="/graph" className={`nav-item ${location.pathname === '/graph' ? 'active' : ''}`}>Graph</Link>
                <Link to="/nodes" className={`nav-item ${location.pathname === '/nodes' ? 'active' : ''}`}>Nodes</Link>
            </div>

            <div className="navbar-right">
                {
                    location.pathname === '/graph' ? (
                        <GraphToggle />
                    ) : location.pathname === '/nodes' ? (
                        <button className="create-db-btn">Create Node</button>
                    ) : (
                        <button className="create-db-btn">Create Database</button>
                    )
                }
                <div className="avatar">A</div>
            </div>
        </nav>
    );
}
