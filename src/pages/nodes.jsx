import Sidebar from "../components/sidebar";
export default function Nodes() {
    return (
        <div className="main">
            <Sidebar page="nodes" />
            {/*<Collection selectedCollection={selectedCollection} />*/}
        </div>
    );
}