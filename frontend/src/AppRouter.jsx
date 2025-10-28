import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import App from "./app";
import Auth from "./components/onboarding/Auth";

const AppRouter = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //localStorage.clear();
        const token = localStorage.getItem("accessToken");
        if (token) setAccessToken(token);
        setLoading(false);
    }, []);

    const handleLogin = (token) => {
        setAccessToken(token);
        localStorage.setItem("accessToken", token);
    };

    const handleLogout = () => {
        setAccessToken(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userProfile");
    };

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={accessToken ? <Navigate to="/" /> : <Auth onLogin={handleLogin} />}
                />
                <Route
                    path="/"
                    element={accessToken ? <App onLogout={handleLogout} /> : <Navigate to="/login" />}
                />
                <Route path="*" element={<Navigate to={accessToken ? "/" : "/login"} />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;
