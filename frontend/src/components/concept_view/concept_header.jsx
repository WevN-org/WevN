import { ArrowLeft, Plus } from "lucide-react";

/**
 * Renders the header section of the page.
 * Includes the page title and the "Add Concept" button.
 */
const ConceptHeader = ({ setConcept, handleBackButton }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <ArrowLeft className="h-6 w-6 text-gray-500 cursor-pointer" onClick={handleBackButton} />
            <h1 className="text-base sm:text-2xl font-bold text-gray-800">Personal Knowledge</h1>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-full shadow-lg transition-colors duration-200 flex items-center sm:space-x-2">
            <Plus className="h-5 w-5" />
            <span className="hidden sm:block">Add Concept</span>
            {/* should open a model */}
        </button>
    </div>
);

export default ConceptHeader;