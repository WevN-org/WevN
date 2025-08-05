import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/navbar";
import Dashboard from './pages/dashboard';
import Nodes from './pages/Nodes';
import GraphPage from './pages/graphpage';

export default function App() {
    return (
        <>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/graph" element={<GraphPage />} />
                    <Route path="/nodes" element={<Nodes />} />
                </Routes>
            </Router>
        </>
    );
}