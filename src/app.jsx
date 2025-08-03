import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/navbar";
import Dashboard from './pages/dashboard';
import Graph from './pages/Graph';
import Nodes from './pages/Nodes';

export default function App() {
    return (
        <>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/graph" element={<Graph />} />
                    <Route path="/nodes" element={<Nodes />} />
                </Routes>
            </Router>
        </>
    );
}