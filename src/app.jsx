import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/navbar";
import Dashboard from './pages/dashboard';
import Nodes from './pages/Nodes';
import GraphPage from './pages/graphpage';
import LogProvider from './context/LogProvider';
import CollectionsProvider from './context/CollectionsProvider';

export default function App() {
    return (
        <>
            <CollectionsProvider>
                <LogProvider>
                    <Router>
                        <Navbar />
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/graph" element={<GraphPage />} />
                            <Route path="/nodes" element={<Nodes />} />
                        </Routes>
                    </Router>
                </LogProvider>
            </CollectionsProvider>
        </>
    );
}