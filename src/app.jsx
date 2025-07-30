import './app.css'
import Collection from "./components/collection";
import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";

export default function App() {
    return (
        <>
            <Navbar />
            <div className="main">
                <Sidebar />
                <Collection />
            </div>
        </>
    );
}