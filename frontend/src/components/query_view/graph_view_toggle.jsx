import { Network } from "lucide-react";

export default function GraphViewToggle({ graphVisibility, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
        ${graphVisibility ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}
        >
            <Network size={20} />
            {!graphVisibility && (
                <span
                    className="absolute w-[2px] h-6 bg-gray-500 rotate-45 rounded"
                    style={{ opacity: 0.6 }}
                ></span>
            )}
        </button>
    );
}
