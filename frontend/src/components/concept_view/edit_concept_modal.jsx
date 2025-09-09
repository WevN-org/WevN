// components/concepts/EditConceptModal.jsx
import { useState, useRef } from "react";
import { ChevronDown, X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNodes } from "../../contexts/nodes-context/nodes_context";
import { useDomain } from "../../contexts/domain-context/domain_context";

const EditConceptModal = ({ concept, onSave, onCancel }) => {
  const { currentDomain } = useDomain();
  const { nodesList } = useNodes();

  const [nodeName, setNodeName] = useState(concept?.name || "");
  const [nodeContent, setNodeContent] = useState(concept?.content || "");
 const [selectedNodes, setSelectedNodes] = useState(
  concept?.user_links?.map(id => nodesList.find(n => n.node_id === id)) || []
);
// expects concept.links = [{node_id, name}, ...]
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const nodeRef = useRef(null);

  // Filter available nodes (exclude already linked)
  const availableNodes =
    nodesList?.filter(
      (node) => !selectedNodes.some((sel) => sel.node_id === node.node_id)
    ) || [];

  const handleDomainSelect = (node) => {
    setSelectedNodes([...selectedNodes, node]);
    setShowDomainDropdown(false);
  };

  const removeDomain = (nodeId) => {
    setSelectedNodes(selectedNodes.filter((n) => n.node_id !== nodeId));
  };

  const handleSave = () => {
    const selectedLinks = selectedNodes.map(node => node.node_id)
    onSave({
      ...concept,
      name: nodeName,
      content: nodeContent,
      user_links: selectedLinks,
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Concept
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Node Name */}
          <div>
            <label
              htmlFor="node_Name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Node Name
            </label>
            <input
              id="node_Name"
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="Enter node name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            />
          </div>

          {/* Linked Nodes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Linked Nodes
            </label>

            {selectedNodes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedNodes.map((node) => (
                  <div
                    key={node.node_id || node.name} 
                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{node.name}</span>
                    <button
                      onClick={() => removeDomain(node.node_id)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropdown */}
            <div className="relative" ref={nodeRef}>
              <button
                onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                disabled={availableNodes.length === 0}
                className={`flex items-center justify-between w-full px-3 py-2 text-left border border-gray-300 rounded-lg transition-colors ${
                  availableNodes.length === 0
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Plus size={16} />
                  <span>
                    {availableNodes.length === 0
                      ? "All nodes selected"
                      : "Add node link"}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    showDomainDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDomainDropdown && availableNodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 max-h-48 overflow-y-auto"
                >
                  {availableNodes.map((node) => (
                    <button
                      key={node.node_id || node.name} 
                      onClick={() => handleDomainSelect(node)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center space-x-2"
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>{node.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="nodeContent"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content
            </label>
            <textarea
              id="nodeContent"
              value={nodeContent}
              onChange={(e) => setNodeContent(e.target.value)}
              placeholder="Enter node content..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-vertical min-h-[200px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!nodeName.trim()}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              nodeName.trim()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Update Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditConceptModal;
