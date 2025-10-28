import { cache, useState } from "react";
import { useNodes } from "../../contexts/nodes-context/nodes_context";
import ConceptCard from "./concept_card";
import DeleteConceptModal from "./delete_concept_modal";
import EditConceptModal from "./edit_concept_modal";
import { ApiService } from "../../../../backend/api-service/api_service";
import { useDomain } from "../../contexts/domain-context/domain_context";
import { toast } from "react-toastify";
import { useDomainsList } from "../../contexts/domans-list-context/domains_list_context";
import { useLinks } from "../../contexts/link-context/link_context";

const ConceptList = () => {
    const { nodesList } = useNodes();
    const { currentDomain } = useDomain();
    const [editConcept, setEditConcept] = useState(null);
    const [deleteConcept, setDeleteConcept] = useState(null);
    const { domainLinks } = useLinks();
    const { domains } = useDomainsList();



    const handleEditSave = async (updated) => {
        setEditConcept(null);

        try {
            let max_links = 20;
            let distance_threshold = 1.3;

            if (domains.length > 0) {
                const dm = domains.find((d) => d.name === currentDomain);
                if (dm) {
                    const saved = domainLinks[dm.id];
                    if (saved) {
                        max_links = Number.isInteger(saved.max_links) && saved.max_links >= 0
                            ? saved.max_links
                            : 20;

                        distance_threshold =
                            typeof saved.distance_threshold === "number" &&
                                saved.distance_threshold >= 0
                                ? saved.distance_threshold
                                : 1.3;
                    }
                }
            }

            await ApiService.updateNode(
                currentDomain,
                updated.node_id,
                updated.name,
                updated.content,
                updated.user_links,
                max_links,
                distance_threshold
            );

            toast.success(`Updated node - ${updated.name}`);
        } catch (err) {
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
