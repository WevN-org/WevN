import { Search } from "lucide-react";

/**
 * Renders the search input bar.
 */
const ConceptSearchbar = () => (
    <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
            type="text"
            placeholder="Search concepts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
    </div>
);

export default ConceptSearchbar;