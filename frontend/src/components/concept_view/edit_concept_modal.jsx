// components/concepts/EditConceptModal.jsx
import { useState } from "react";
import Modal from "../../common/modal";

const EditConceptModal = ({ concept, onSave, onCancel }) => {
    const [name, setName] = useState(concept.name);
    const [content, setContent] = useState(concept.content);

    const handleSave = () => {
        onSave({ ...concept, name, content });
    };

    return (
        <Modal title="Edit Concept" onClose={onCancel}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-gray-800"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-gray-800"
                        rows={4}
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditConceptModal;
