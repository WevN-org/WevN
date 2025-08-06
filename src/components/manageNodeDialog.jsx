import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import "../styles/component_styles/manageNodeDialog.css";

const ManageNodeDialog = ({ onSubmit, onClose }) => {
  const [collectionName, setCollectionName] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [content, setContent] = useState("");
  const [userLinks, setUserLinks] = useState("");

  const handleSubmit = () => {
    if (!collectionName || !nodeId) {
      alert("Collection Name and Node ID are required.");
      return;
    }
    onSubmit({ collectionName, nodeId, content, userLinks });
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog-container">
        <div className="dialog-header">
          <h2 className="dialog-title">Create new Collection</h2>
          <MdClose className="dialog-close" onClick={onClose} />
        </div>

        <input
          type="text"
          placeholder="Collection Name"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          className="dialog-input"
        />
        <input
          type="text"
          placeholder="Node ID"
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
          className="dialog-input"
        />
        <textarea
          placeholder="Content (used only when adding new node)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="dialog-textarea"
          rows={3}
        />
        <textarea
          placeholder="User Links (comma-separated)"
          value={userLinks}
          onChange={(e) => setUserLinks(e.target.value)}
          className="dialog-textarea"
          rows={2}
        />

        <button onClick={handleSubmit} className="dialog-button">
          Add or Update Node
        </button>
      </div>
    </div>
  );
};

export default ManageNodeDialog;
