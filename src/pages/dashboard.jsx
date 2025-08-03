import Sidebar from "../components/sidebar";
import Collection from "../components/collection";
import './styles/dashboard.css'
import { useState } from "react";
import { collections } from "../../data/collection_data";

export default function Dashboard() {
    const [selectedCollection, setActiveCollection] = useState(collections[0].name);
    function showCollection(CollectionName) {
        console.log(` ${CollectionName} Collection clicked`);
        setActiveCollection(CollectionName);
    }
    return (
        <div className="main">
            <Sidebar onClick={showCollection} />
            <Collection selectedCollection={selectedCollection} />
        </div>
    );
}

