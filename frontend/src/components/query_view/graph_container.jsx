import clsx from "clsx";
import React,{ useEffect, useState, useRef, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import "./css/GraphPage.css";
import { useNodes } from "../../contexts/nodes-context/nodes_context";
import { toast } from "react-toastify";
import EditConceptModal from "../concept_view/edit_concept_modal";
import { ApiService } from "../../../../backend/api-service/api_service";
import { useDomain } from "../../contexts/domain-context/domain_context";
import { useLinks } from "../../contexts/link-context/link_context";
import { useDomainsList } from "../../contexts/domans-list-context/domains_list_context";
import { useRagList } from "../../contexts/rag-list-context/rag_list_context";

const GraphContainer = React.memo(function GraphContainer({ isVisible }) {
    const { domainLinks, setLinksForDomain } = useLinks();
    const { domains } = useDomainsList();
    // console.log(domainLinks)
    const containerRef = useRef();
    const fgRef = useRef();
    const { nodesList } = useNodes();

    const [_, setLoading] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [useSemanticLinks, setUseSemanticLinks] = useState(false);
    const [maxSemanticLinks, setMaxSemanticLinks] = useState(10);
    const [threshold, setThreshold] = useState(1.3);
    const [savedSettings, setSavedSettings] = useState({
        maxSemanticLinks: 20,
        threshold: 1.4,
    });
    const { currentDomain } = useDomain();
    const [editConcept, setEditConcept] = useState(null);
    const { ragList, setRagList } = useRagList();

    // useEffect(() => {
    //     console.log("----->R:", ragList)
    // },[ragList])


    // edit node functions
    const handleEditSave = async (updated) => {
        // console.log("Save concept:", updated);
        setEditConcept(null);

        try {
            await ApiService.updateNode(
                currentDomain,
                updated.node_id,
                updated.name,
                updated.content,
                updated.user_links,
                maxSemanticLinks,
                threshold

            )
            toast.success(`updated nodes - ${updated.name}`)
        }
        catch (err) {
            toast.error(`Failed to update concept ${err}. Please try again.`);
        }
    };

    useEffect(() => {
        try {
            if (domains.length > 0) {
                console.log(domains)
                const dm = domains.find((d) => d.name === currentDomain)
                const saved = domainLinks[dm.id]
                if (saved) {
                    const max_links = saved.max_links ?? 20
                    const distance_threshold = saved.distance_threshold ?? 1.3
                    setMaxSemanticLinks(max_links);
                    setThreshold(distance_threshold);
                    setSavedSettings({
                        maxSemanticLinks: max_links,
                        threshold: distance_threshold
                    });
                }
            }
        }
        catch (e) {
            console.log("error: ", e)
        }
    }, [currentDomain, domains]);

    useEffect(() => {
        const saved = localStorage.getItem("graphSemanticView");
        if (saved) {
            const parsed = JSON.parse(saved);
            setUseSemanticLinks(parsed.useSemanticLinks ?? false);
        }
    }, [])

    const toggleSemanticLinks = () => {
        setUseSemanticLinks(prev => {
            const next = !prev;
            localStorage.setItem("graphSemanticView", JSON.stringify({ useSemanticLinks: next }));
            return next;
        });
    };

    const hasChanges =
        savedSettings &&
        (savedSettings.maxSemanticLinks !== maxSemanticLinks ||
            savedSettings.threshold !== threshold);

    const handleSave = async () => {
        try {
            await ApiService.refactorNode(currentDomain, maxSemanticLinks, threshold);

            const domainObj = domains.find(d => d.name === currentDomain);
            if (!domainObj) {
                console.error("Domain not found for currentDomain:", currentDomain);
                return;
            }

            const domainId = domainObj.id;
            console.log("dId", domainId)

            setLinksForDomain(domainId, threshold, maxSemanticLinks);

            setSavedSettings({
                maxSemanticLinks,
                threshold,
            }); // update baseline

            toast.success("Refactored semantic links");
        } catch (err) {
            toast.error(`Failed to refactor links - ${err}`);
        }
    };


    // Resize observer
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setDimensions({ width, height });
        });
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Random bright color
    function getRandomBrightColor() {
        const hue = Math.floor(Math.random() * 360); // output [0,1) * 360 - floor roundes it - for a specific range use ([0,1) * (max - min)) + min  
        return `hsl(${hue}, 100%, 50%)`;
    }

    // Load nodes
    useEffect(() => {
        if (!nodesList) {
            return;
        }

        const formattedNodes = nodesList.map((n) => ({
            id: n.node_id,
            label: n.name || n.node_id,
            type: "note",
            color: getRandomBrightColor(),
        }));

        setGraphData((prev) => ({
            nodes: formattedNodes,
            links: []

        }));
        toast.success(`🧠 Loaded ${nodesList.length} nodes`);
    }, [nodesList]);

    // Build links
    useEffect(() => {
        if (!nodesList || nodesList.length === 0) return;

        const validNodeIds = new Set(nodesList.map((n) => n.node_id));
        const links = [];

        for (const node of nodesList) {
            for (const targetId of (useSemanticLinks ? node.s_links : node.user_links) || []) {
                if (validNodeIds.has(node.node_id) && validNodeIds.has(targetId)) {
                    links.push({ source: node.node_id, target: targetId });
                }
            }
        }

        setGraphData((prev) => ({
            nodes: prev.nodes,
            links,
        }));
    }, [nodesList, useSemanticLinks]);

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force("charge").strength(-30);
            fgRef.current.d3Force("link").distance(50);
        }
    }, []);



    return (
        <div
            className={clsx(
                "overflow-hidden relative flex flex-col items-center justify-center transition-all duration-500 ease-in-out origin-top md:origin-right",
                isVisible
                    ? "w-full flex-2 md:w-3/5 opacity-100"
                    : "w-0 opacity-0 flex-0"
            )}
        >
            <div className="graph-container" ref={containerRef}>
                <ForceGraph2D

                    ref={fgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel={(node) => node.label}
                    nodeCanvasObject={(node, ctx, globalScale) => {

                        if (ragList.includes(node.id)) {
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI, false); // slightly bigger radius
                            ctx.fillStyle = "rgba(255, 215, 0, 0.3)"; // gold halo
                            ctx.fill();
                        }
                        // node circle
                        ctx.fillStyle = node.color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                        ctx.fill();

                        ctx.font = `${14 / globalScale}px Sans-Serif`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "black";
                        ctx.fillText(node.label, node.x, node.y + 15);
                    }}
                    // linkDirectionalParticles={1}
                    // linkDirectionalParticleColor={(link) => link.source.color}
                    // linkDirectionalParticleSpeed={0.004}
                    linkColor={() => "#ccccccff"}
                    backgroundColor="#fff"
                    onNodeClick={(node) => {
                        if (!fgRef.current) return;

                        // fgRef.current.zoomToFit(500, 350, n => n.id === node.id);
                        fgRef.current.centerAt(node.x, node.y, 1000); // smoothly center on node
                        fgRef.current.zoom(3, 1000);
                    }}

                    onNodeRightClick={(node) => {
                        setEditConcept(nodesList.find((n) => n.node_id === node.id))
                    }}


                />
            </div>

            {/* Graph Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl">
                <div className="flex flex-wrap items-center justify-center gap-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 shadow-lg">

                    {/* Toggle */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 select-none min-w-[90px] text-right">
                            {useSemanticLinks ? "Semantic Links" : "User Links"}
                        </span>
                        <button
                            type="button"
                            onClick={() => toggleSemanticLinks()}
                            className={clsx(
                                "relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200",
                                useSemanticLinks ? "bg-blue-600" : "bg-gray-300"
                            )}
                        >
                            <span
                                className={clsx(
                                    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
                                    useSemanticLinks ? "translate-x-6" : "translate-x-1"
                                )}
                            />
                        </button>
                    </div>

                    {/* Max Semantic Links */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 whitespace-nowrap">Max Links</label>
                        <input
                            type="number"
                            value={maxSemanticLinks}
                            onChange={(e) => setMaxSemanticLinks(Number(e.target.value))}
                            min={1}
                            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Threshold */}
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                        <span className="text-sm text-gray-800 whitespace-nowrap font-medium text-right font-mono">
                            Threshold ({threshold.toFixed(2)})
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.01"
                            value={threshold}
                            onInput={(e) => setThreshold(Number(e.target.value))}
                            className="flex-1 accent-blue-600"
                        />
                    </div>

                    {/* Save button */}
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`px-3 py-1 rounded ${hasChanges
                            ? "bg-green-600 text-white"
                            : "bg-gray-300 text-gray-500"
                            }`}
                    >
                        Save
                    </button>
                </div>
            </div>



            {editConcept && (
                <EditConceptModal
                    concept={editConcept}
                    onSave={handleEditSave}
                    onCancel={() => setEditConcept(null)}
                />
            )}
        </div>
    );
});

export default GraphContainer;