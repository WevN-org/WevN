import { useState } from 'react';
import ConceptList from "./concept_list";
import ConceptTabNav from "./concept_tabnav";
import ConceptSearchbar from "./concept_searchbar";
import ConceptHeader from "./concept_header";
import CreateConceptModel from './create_concept_model';

const ConceptView = ({ activeTab, setActiveTab, setState }) => {
    const [showCreateNodePopup, setShowNodeCreatePopup] = useState(false);
    
    // Filter out already selected domains
    
    const handleBackButton = () => {
        setState(prev => ({
            ...prev,
            currentView: 'query',
            selectedDomainId: null
        }));
    };


    return (
        <>
            <div className="w-full bg-gray-50 h-screen p-4 sm:p-8 font-sans antialiased ">
                <div className="h-screen max-w-4xl mx-auto space-y-6">
                    <ConceptHeader handleBackButton={handleBackButton} setShowNodeCreatePopup={setShowNodeCreatePopup} />
                    <ConceptSearchbar />
                    <ConceptTabNav activeTab={activeTab} setActiveTab={setActiveTab} />
                    <ConceptList />
                </div>
            </div>

            {/* Create Node Popup */}
            {showCreateNodePopup && (<CreateConceptModel setShowNodeCreatePopup={setShowNodeCreatePopup}/>)}
        </>
    );
}

export default ConceptView;