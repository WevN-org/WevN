import { useState } from 'react';
import '../styles/component_styles/graph_toggle.css';

export default function GraphToggle({ onToggle }) {
    const [active, setActive] = useState('link');

    const handleToggle = (option) => {
        setActive(option);
        if (onToggle) onToggle(option);
    };

    return (
        <div className="toggle-switch">
            <button
                className={`toggle-btn ${active === 'link' ? 'active' : ''}`}
                onClick={() => handleToggle('link')}
            >
                Link
            </button>
            <button
                className={`toggle-btn ${active === 'semantic' ? 'active' : ''}`}
                onClick={() => handleToggle('semantic')}
            >
                Semantic
            </button>
        </div>
    );
}
