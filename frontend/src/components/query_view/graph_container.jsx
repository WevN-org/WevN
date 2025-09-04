import clsx from "clsx";
import { useEffect, useState, useRef } from "react";
import ForceGraph2D from 'react-force-graph-2d';
import "./css/GraphPage.css"
import { useNodes } from "../../contexts/nodes-context/nodes_context";
import { toast } from "react-toastify";

export default function GraphContainer({ isVisible }) {
    const containerRef = useRef();
    const fgRef = useRef();
    const { nodesList } = useNodes();
    const [_, setLoading] = useState(false)
    const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });

    // graph view resizer according to the change in app
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setDimensions({ width, height });
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    // Random bright color generator
    function getRandomBrightColor() {
        const hue = Math.floor(Math.random() * 360); // hue: 0–360
        return `hsl(${hue}, 100%, 50%)`; // full saturation, medium lightness
    }

    // graph loader
    useEffect(() => {
        console.log("@ Graph Loader", nodesList);
        if (!nodesList) {
            setLoading(true);
            return
        };
        console.log("@ Graph Loader2");
        // format nodes for the graph
        const formattedNodes = nodesList.map((n) => ({
            id: n.node_id,
            label: n.name || n.node_id,
            type: 'note', // default type
            color: getRandomBrightColor(),
        }));

        // prepare links
        const validNodeIds = new Set(formattedNodes.map((n) => n.id));
        const links = [];

        for (const node of nodesList) {
            for (const targetId of node.user_links || []) {
                if (validNodeIds.has(node.node_id) && validNodeIds.has(targetId)) {
                    links.push({ source: node.node_id, target: targetId });
                }
            }
        }

        // update graph data
        setGraphData({ nodes: formattedNodes, links });
        setLoading(false)
        // for debugging remove when necessory
        toast.success(`🧠 Loaded ${nodesList.length} nodes`);

        // optional: auto-zoom the graph
        setTimeout(() => {
            if (fgRef.current) {
                fgRef.current.zoomToFit(700, 200);
            }
        }, 100);
    }, [nodesList]);




    return (
        <div
            className={clsx(
                "overflow-hidden flex flex-col items-center justify-center transition-all duration-500 ease-in-out origin-top md:origin-right ",
                isVisible
                    ? "w-full flex-1 md:w-3/5 opacity-100" // 100% on mobile, 60% on desktop
                    : "w-0 opacity-0 flex-0"             // collapsed
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
                        // fgRef.current.zoomToFit(0);
                        // fgRef.current.cameraPosition({ z: 500 });
                        const label = node.label;
                        const fontSize = 12 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        // ctx.fillStyle = colorByType[node.type] || "#fff";
                        ctx.fillStyle = node.color
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                        ctx.fill();
                        ctx.fillStyle = "black";
                        ctx.fillText(label, node.x + 8, node.y + 4);
                        fgRef.current.d3Force('charge').strength(-100); // increase repulsion

                    }}


                    linkDirectionalParticles={2}
                    linkDirectionalParticleColor={(link) => link.source.color}
                    linkDirectionalParticleSpeed={0.008}


                    linkColor={() => "#ccccccff"}
                    backgroundColor="#fff"

                    onNodeClick={(node) => {

                        fgRef.current.zoomToFit(500, 400, n => n.id === node.id);
                    }}
                />

            </div>
        </div>
    );
}
