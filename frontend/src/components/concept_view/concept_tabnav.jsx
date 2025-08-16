/**
 * Renders the tab navigation for filtering concepts.
 * @param {{ activeTab: string, setActiveTab: function }} props
 */
const ConceptTabNav = ({ activeTab, setActiveTab }) => (
    <div className="flex items-center border-b border-gray-200">
        {['All', 'Favourites', 'History'].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-4 text-sm font-medium ${activeTab === tab
                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                    }`}
            >
                {tab}
            </button>
        ))}
    </div>
);

export default ConceptTabNav;