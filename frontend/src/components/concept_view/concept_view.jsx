import ConceptList from "./concept_list";
import ConceptTabNav from "./concept_tabnav";
import ConceptSearchbar from "./concept_searchbar";
import ConceptHeader from "./concept_header";

const ConceptView = ({ concepts, setConcepts, activeTab, setActiveTab, setState }) => {
    const handleBackButton = () => {
        setState(prev => ({
            ...prev,
            currentView: 'query',
            selectedDomainId: null
        }));
    };
    return (
        <div className="w-full bg-gray-50 min-h-screen p-4 sm:p-8 font-sans antialiased ">
            <div className="max-w-4xl mx-auto space-y-6">
                <ConceptHeader handleBackButton={handleBackButton} />
                <ConceptTabNav activeTab={activeTab} setActiveTab={setActiveTab} />
                <ConceptSearchbar />
                <ConceptList concepts={concepts} />
            </div>
        </div>
    );
}

export default ConceptView;