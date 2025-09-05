// components/common/Modal.jsx
const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">

        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            {children}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
                ✕
            </button>
        </div>
    </div>
);

export default Modal;
