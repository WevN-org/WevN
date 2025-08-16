import { Pencil, Trash2 } from "lucide-react";
/**
 * Renders a single concept card with a title, description, and action buttons.
 * @param {{ concept: { id: number, title: string, description: string } }} props
 */
const ConceptCard = ({ concept }) => (
    <div
        key={concept.id}
        className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 transition-shadow duration-200 hover:shadow-lg"
    >
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    {concept.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                    {concept.description}
                </p>
            </div>
            <div className="flex space-x-2 ml-4 mt-1 sm:mt-0">
                <button className="p-2 text-gray-500 hover:text-emerald-500 transition-colors duration-200 rounded-full hover:bg-gray-100">
                    <Pencil className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-red-500 transition-colors duration-200 rounded-full hover:bg-gray-100">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
);

export default ConceptCard;