// components/concepts/DeleteConceptModal.jsx
import Modal from "../../common/modal";

const DeleteConceptModal = ({ concept, onConfirm, onCancel }) => (
    <Modal title="Delete Concept" onClose={onCancel}>
        <p className="text-gray-700 mb-6">
            Are you sure you want to delete <b>{concept.name}</b>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
            <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
                Cancel
            </button>
            <button
                onClick={() => onConfirm(concept)}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
            >
                Delete
            </button>
        </div>
    </Modal>
);

export default DeleteConceptModal;
