// CreateCollectionDialog.jsx
import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import "../styles/component_styles/manageNodeDialog.css";

const CreateCollectionDialog = ({ onSubmit, onClose }) => {
    const [collectionName, setCollectionName] = useState("");

    const handleSubmit = () => {
        if (!collectionName.trim()) {
            alert("Collection name is required.");
            return;
        }
        onSubmit(collectionName);
    };

    return (
        <div className="dialog-backdrop">
            <div className="dialog-container">
                <div className="dialog-header">
                    <h2 className="dialog-title">Create Collection</h2>
                    <MdClose className="dialog-close" onClick={onClose} />
                </div>

                <div className="dialog-content">
                    <input
                        type="text"
                        placeholder="Collection Name"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        className="dialog-input"
                    />

                    <button onClick={handleSubmit} className="dialog-button">
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateCollectionDialog;
