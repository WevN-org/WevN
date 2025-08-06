import Sidebar from "../components/sidebar";
import Collection from "../components/collection";
import '../styles/page_styles/dashboard.css';
import { useState } from "react";

export default function Dashboard() {
    const [selectedCollection, setActiveCollection] = useState("");
    function showCollection(CollectionName) {
        //console.log(` ${CollectionName} Collection clicked`);
        setActiveCollection(CollectionName);
    }
    return (
        <div className="main">
            <Sidebar onClick={showCollection} selectedCollection={selectedCollection} />
            <Collection selectedCollection={selectedCollection} />
        </div>
    );
}

