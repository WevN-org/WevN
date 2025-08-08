import Sidebar from "../components/sidebar";
import Collection from "../components/collection";
import '../styles/page_styles/dashboard.css';
import { useCollection } from "../context/CollectionContext";

export default function Dashboard() {
    const { currentCollection, setCollection } = useCollection();
    function showCollection(CollectionName) {
        console.log(` ${CollectionName} Collection clicked`);
        setCollection(CollectionName)

    }
    return (
        <div className="main">
            <Sidebar onClick={showCollection} />
            <Collection selectedCollection={currentCollection} />
        </div>
    );
}

