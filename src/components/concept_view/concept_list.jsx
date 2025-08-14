import ConceptCard from "./concept_card";

/**
 * Renders a list of concept cards.
 * @param {{ concepts: Array }} props
 */
const ConceptList = ({ concepts }) => (
    <div className=" space-y-4 max-h-[500px] overflow-y-auto">
        {concepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
        ))}
    </div>
);

export default ConceptList;