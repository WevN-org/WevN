import clsx from "clsx";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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

// 1. ✅ STABLE COLORS: A simple hash function to generate a consistent color from a node ID.
const stringToColor = (str) => {
    // 1. We still use FNV-1a to get a good hash.
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash *= 16777619;
    }
    // 2. ✅ The Fix: Force the hash to be a positive 32-bit integer.
    // The '>>> 0' is a JavaScript trick for unsigned conversion.
    const unsignedHash = hash >>> 0;
    // 3. ✅ Normalize the hash to a 0-1 range using division.
    // 0xffffffff is the largest 32-bit unsigned integer (4,294,967,295).
    const hue = unsignedHash / 0xffffffff;

    // 4. Convert to HSL color.
    return `hsl(${hue * 360}, 90%,55%)`;
};

const GraphContainer = React.memo(function GraphContainer({ isVisible }) {
    const { domainLinks, setLinksForDomain } = useLinks();
    const { domains } = useDomainsList();
    const { nodesList } = useNodes();
    const { currentDomain } = useDomain();
    const { ragList } = useRagList();

    const containerRef = useRef();
    const fgRef = useRef();

    const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
    const [editConcept, setEditConcept] = useState(null);

    // 2. ✅ LAZY INITIALIZATION: Initialize state from localStorage only once.
    const [useSemanticLinks, setUseSemanticLinks] = useState(() => {
        try {
            const saved = localStorage.getItem("graphSemanticView");
            return saved ? JSON.parse(saved).useSemanticLinks ?? false : false;
        } catch {
            return false;
        }
    });

    // 3. ✅ DERIVED STATE: Derive settings directly from context instead of a useEffect->useState chain.
    const savedSettings = useMemo(() => {
        if (!currentDomain || !domains.length) {
            return { maxSemanticLinks: 20, threshold: 1.3 };
        }
        const dm = domains.find((d) => d.name === currentDomain);
        if (!dm) return { maxSemanticLinks: 20, threshold: 1.3 };

        const saved = domainLinks[dm.id];
        return {
            maxSemanticLinks: saved?.max_links ?? 20,
            threshold: saved?.distance_threshold ?? 1.3,
        };
    }, [currentDomain, domains, domainLinks]);

    // Local state for UI controls, initialized from derived settings
    const [maxSemanticLinks, setMaxSemanticLinks] = useState(savedSettings.maxSemanticLinks);
    const [threshold, setThreshold] = useState(savedSettings.threshold);

    // Sync UI state when savedSettings change (e.g., domain switch)
    useEffect(() => {
        setMaxSemanticLinks(savedSettings.maxSemanticLinks);
        setThreshold(savedSettings.threshold);
    }, [savedSettings]);

    // 4. ✅ MEMOIZED GRAPH DATA: Consolidate and memoize node/link calculation.
    // This expensive operation now only runs when nodesList or the link type changes.
    const graphData = useMemo(() => {
        if (!nodesList) return { nodes: [], links: [] };

        const formattedNodes = nodesList.map((n) => ({
            id: n.node_id,
            label: n.name || n.node_id,
            color: stringToColor(n.node_id), // Use stable color
        }));

        const validNodeIds = new Set(formattedNodes.map((n) => n.id));
        const links = [];

        for (const node of nodesList) {
            const linkSource = useSemanticLinks ? node.s_links : node.user_links;
            for (const targetId of linkSource || []) {
                if (validNodeIds.has(node.node_id) && validNodeIds.has(targetId)) {
                    links.push({ source: node.node_id, target: targetId });
                }
            }
        }
        return { nodes: formattedNodes, links };
    }, [nodesList, useSemanticLinks]);


    // 5. ✅ MEMOIZED CALLBACKS: All handlers are wrapped in useCallback.
    const handleEditSave = useCallback(async (updated) => {
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
            );
            toast.success(`Updated node - ${updated.name}`);
        } catch (err) {
            toast.error(`Failed to update concept: ${err}`);
        }
    }, [currentDomain, maxSemanticLinks, threshold]);

    const toggleSemanticLinks = useCallback(() => {
        setUseSemanticLinks(prev => {
            const next = !prev;
            localStorage.setItem("graphSemanticView", JSON.stringify({ useSemanticLinks: next }));
            return next;
        });
    }, []);

    const handleSave = useCallback(async () => {
        try {
            await ApiService.refactorNode(currentDomain, maxSemanticLinks, threshold);
            const domainObj = domains.find(d => d.name === currentDomain);
            if (domainObj) {
                setLinksForDomain(domainObj.id, threshold, maxSemanticLinks);
            }
            toast.success("Refactored semantic links");
        } catch (err) {
            toast.error(`Failed to refactor links: ${err}`);
        }
    }, [currentDomain, maxSemanticLinks, threshold, domains, setLinksForDomain]);

    // This calculation is cheap, so useMemo is optional but doesn't hurt.
    const hasChanges = useMemo(() =>
        savedSettings.maxSemanticLinks !== maxSemanticLinks ||
        savedSettings.threshold !== threshold,
        [savedSettings, maxSemanticLinks, threshold]
    );

    // --- Other Effects (largely unchanged as they were correct) ---

    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setDimensions({ width, height });
        });
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // useEffect(() => {
    //     // Give the physics engine a "kick" to re-evaluate animations.
    //     // This is crucial for when the link structure changes (e.g., toggling semantic links).
    //     if (fgRef.current) {
    //         fgRef.current.d3ReheatSimulation();
    //     }
    // }, [graphData]);
    //     useEffect(() => {
    //     if (fgRef.current) {
    //         fgRef.current.d3ReheatSimulation();
    //         fgRef.current.refresh();  // Important: redraw triggers particle restart
    //     }
    // }, [graphData]);  // <- dependency on graphData





    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force("charge").strength(-30);
            fgRef.current.d3Force("link").distance(50);
        }
    }, []);

    const handleNodeClick = useCallback((node) => {
        if (!fgRef.current) return;
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(3, 1000);
    }, []);

    const handleNodeRightClick = useCallback((node) => {
        setEditConcept(nodesList.find((n) => n.node_id === node.id));
    }, [nodesList]);

    // ✅ FINAL, ROBUST SOLUTION: Handles browser tab throttling.
    useEffect(() => {
        // If there's nothing to animate, do nothing.
        if (ragList.length === 0) {
            return;
        }


        const burstDuration = 1200;
        let intervalId = null; // Use `let` so we can manage it in different functions.

        const emitParticlesNow = () => {
            if (!fgRef.current || !graphData.links) return;

            const linksToAnimate = graphData.links.filter(link =>
                ragList.includes(typeof link.source === 'object' ? link.source.id : link.source)
            );

            linksToAnimate.forEach(link => {
                fgRef.current.emitParticle(link);
            });
        };

        // Helper function to start the animation loop
        const startAnimation = () => {
            // Clear any existing timer to prevent duplicates
            if (intervalId) clearInterval(intervalId);

            // Fire immediately, then set the interval
            emitParticlesNow();
            intervalId = setInterval(emitParticlesNow, burstDuration);
        };

        // Helper function to stop the animation loop
        const stopAnimation = () => {
            clearInterval(intervalId);
        };

        // This function is called by the browser when the tab visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // If page is hidden, stop the timer
                stopAnimation();
            } else {
                // If page becomes visible, restart the timer
                startAnimation();
            }
        };

        // Start the animation when the effect first runs
        startAnimation();

        // Set up the browser event listener
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // IMPORTANT: The cleanup function now has two jobs
        return () => {
            stopAnimation(); // 1. Stop the timer
            document.removeEventListener('visibilitychange', handleVisibilityChange); // 2. Remove the listener
        };

    }, [ragList, graphData]); // Rerun if the core data changes

    const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
        // 1. --- Pulsing Halo Animation ---
        if (ragList.includes(node.id)) {
            // --- Animation settings (tweak these for different effects) ---
            const burstDuration = 1200; // milliseconds for one full burst cycle
            const zoomOutFixRadius = 50 / globalScale;
            const zoomInFixRadius = 20
            const maxBurstRadius = zoomOutFixRadius> zoomInFixRadius ? zoomOutFixRadius : zoomInFixRadius  // Max radius of the burst circle
            const baseAlpha = 1;      // Starting opacity for the burst

            // Calculate time since component mount (or start of animation)
            const currentTime = Date.now();

            // Calculate a phase for the animation (0 to 1) that loops
            const phase = (currentTime % burstDuration) / burstDuration; // 0 -> 1 -> 0 -> 1...

            // Use phase to determine current radius and opacity
            // Radius grows from 0 to maxBurstRadius
            const currentRadius = maxBurstRadius * phase;

            // Opacity fades out as it expands: starts at baseAlpha, goes to 0
            const currentAlpha = baseAlpha * (1 - phase);

            const burstColor = node.color
                .replace('hsl', 'hsla') // Change hsl to hsla
                .replace(')', `, ${currentAlpha})`);

            // Draw the animated halo
            ctx.beginPath();
            ctx.arc(node.x, node.y, currentRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = burstColor;
            ctx.fill();
            // ctx.lineWidth = 5 / globalScale; // Make line thin regardless of zoom
            // ctx.strokeStyle = burstColor; // Slightly stronger gold outline
            // ctx.stroke();
        }

        // 2. --- Main Node Circle (unchanged) ---
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
        ctx.fill();

        // 3. --- Node Label  ---
        const TEXT_VISIBILITY_THRESHOLD = 1.1;
        if (globalScale >= TEXT_VISIBILITY_THRESHOLD) {
            // 3. If it is, draw the text as before
            ctx.font = `${13 / globalScale}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            ctx.fillText(node.label, node.x, node.y + 10);
        }

    }, [ragList]); // Make sure ragList is in the dependency array if you use useCallback

    // At the top of your component
    // const getLinkParticles = useCallback((link) => {
    //     return ragList.includes(link.source.id) ? 1 : 0;
    // }, [ragList]);

    // const getLinkParticleColor = useCallback((link) => link.source.color, []);

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
                    cooldownTime={ragList.length > 0 ? 60000 : 15000}
                    nodeLabel="label"
                    nodeCanvasObject={nodeCanvasObject}
                    linkColor={() => "#ccccccff"}
                    backgroundColor="#fff"
                    onNodeClick={handleNodeClick}
                    onNodeRightClick={handleNodeRightClick}
                    linkDirectionalParticleColor={(link) => link.source.color}
                    linkDirectionalParticleSpeed={0.006} // The synced speed we calculated
                    // linkDirectionalParticleWidth={2}
                // linkDirectionalParticles={getLinkParticles}
                // linkDirectionalParticleColor={getLinkParticleColor}
                // linkDirectionalParticleSpeed={0.006}
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
                            onClick={toggleSemanticLinks}
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
                        className={`px-3 py-1 rounded transition-colors ${hasChanges
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
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