import React from "react";
import { MdClose } from "react-icons/md";
import "./styles/manageNodeDialog.css";

const ConfirmDeleteDialog = ({ onConfirm, onCancel }) => {
    return (
        <div className="dialog-backdrop">
            <div className="dialog-container">
                <div className="dialog-header">
                    <h2 className="dialog-title">Delete Collection</h2>
                    <MdClose className="dialog-close" onClick={onCancel} />
                </div>

                <p style={{ marginBottom: "24px", color: "var(--text-light)" }}>
                    Are you sure you want to delete this collection? This action cannot be undone.
                </p>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button
                        className="dialog-button"
                        onClick={onCancel}
                        style={{
                            backgroundColor: "transparent",
                            color: "var(--text-light)",
                            border: "1px solid var(--color-secondary)",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="dialog-button"
                        onClick={onConfirm}
                        style={{
                            backgroundColor: "var(--color-secondary)",
                            color: "var(--color-primary)",
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteDialog;
