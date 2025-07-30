import Sidebar from "../components/sidebar";
import Collection from "../components/collection";
import './styles/dashboard.css'

export default function Dashboard() {
    return (
        <div className="main">
            <Sidebar />
            <Collection />
        </div>
    );
}