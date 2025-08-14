import GraphViewToggle from "./graph__view_toggle";

export default function PromptBox({ graphVisibility, toggleGraph, state, setState }) {
    return (
        <div className="relative flex border items-center border-gray-300 rounded-xl shadow-sm focus-within:ring-4 focus-within:ring-blue-200 transition-all duration-200 overflow-hidden">

            <GraphViewToggle graphVisibility={graphVisibility} onToggle={toggleGraph} />

            <input
                type="text"
                placeholder="Ask a question..."
                className="flex-grow p-4 focus:outline-none border-r border-gray-300"
            />

            <select
                id="query-domain-select"
                className="bg-white pl-4 pr-16 py-4 text-gray-700 font-medium focus:outline-none appearance-none"
                value={state.selectedDomainId || ""}
                onChange={(e) => setState({ ...state, selectedDomainId: Number(e.target.value) })}
            >
                {state.domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                        {domain.name}
                    </option>
                ))}
            </select>

            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </span>
        </div>
    );
}
