import { useState } from "react";
import { useNodes } from "../../contexts/nodes-context/nodes_context";
import ConceptCard from "./concept_card";
import DeleteConceptModal from "./delete_concept_modal";
import EditConceptModal from "./edit_concept_modal";

const ConceptList = () => {
    const { nodesList } = useNodes();

    const [editConcept, setEditConcept] = useState(null);
    const [deleteConcept, setDeleteConcept] = useState(null);

    const handleEditSave = (updated) => {
        console.log("Save concept:", updated);
        setEditConcept(null);
        // TODO: update via context/api
    };

    const handleDeleteConfirm = (concept) => {
        console.log("Delete concept:", concept);
        setDeleteConcept(null);
        // TODO: remove via context/api
    };

    return (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {nodesList.map((concept) => (
                <ConceptCard
                    key={concept.node_id}
                    concept={concept}
                    onEdit={() => setEditConcept(concept)}
                    onDelete={() => setDeleteConcept(concept)}
                />
            ))}

            {editConcept && (
                <EditConceptModal
                    concept={editConcept}
                    onSave={handleEditSave}
                    onCancel={() => setEditConcept(null)}
                />
            )}

            {deleteConcept && (
                <DeleteConceptModal
                    concept={deleteConcept}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteConcept(null)}
                />
            )}
        </div>
    );
};

export default ConceptList;
