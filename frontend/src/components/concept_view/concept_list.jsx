import { cache, useState } from "react";
import { useNodes } from "../../contexts/nodes-context/nodes_context";
import ConceptCard from "./concept_card";
import DeleteConceptModal from "./delete_concept_modal";
import EditConceptModal from "./edit_concept_modal";
import { ApiService } from "../../../../backend/api-service/api_service";
import { useDomain } from "../../contexts/domain-context/domain_context";
import { toast } from "react-toastify";

const ConceptList = () => {
    const { nodesList } = useNodes();
    const { currentDomain } = useDomain();
    const [editConcept, setEditConcept] = useState(null);
    const [deleteConcept, setDeleteConcept] = useState(null);

    const handleEditSave = async (updated) => {
        // console.log("Save concept:", updated);
        setEditConcept(null);

        try {
            await ApiService.updateNode(
                currentDomain,
                updated.node_id,
                updated.name,
                updated.content,
                updated.user_links

            )
            toast.success(`updated nodes - ${updated.name}`)
        }
        catch (err) {
            toast.error(`Failed to update concept ${err}. Please try again.`);
        }
    };

    const handleDeleteConfirm = async (concept) => {
        console.log("Delete concept:", concept);
        setDeleteConcept(null);
        // TODO: remove via context/api
        try {
            await ApiService.deleteNode(currentDomain, concept.node_id);
            toast.success(`Deleted Node ${concept.name}`)
        }
        catch (err) {
            toast.error(`Failed to delete concept ${err}. Please try again.`);
        }
    };

    return (
        <div className="space-y-4 h-[700px] overflow-y-auto pr-2">
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
