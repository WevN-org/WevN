import './styles/navbar.css'

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <span className="logo">WevN</span>
                <div className="nav-item active">
                    <i className="icon home-icon"></i>
                    Dashboard
                </div>
                <div className="nav-item">
                    <i className="icon graph-icon"></i>
                    Graph
                </div>
                <div className="nav-item">
                    <i className="icon nodes-icon"></i>
                    Nodes
                </div>
            </div>

            <div className="navbar-right">
                <button className="create-db-btn">Create New Database</button>
                <div className="avatar">A</div>
            </div>
        </nav>
    );
}
