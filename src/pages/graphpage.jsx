import { useEffect, useState, useRef } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { ApiService } from '../services/apiservice';
import { useLog } from '../context/LogContext';
import '../pages/styles/graphpage.css';

export default function GraphPage() {
    const fgRef = useRef();
    const containerRef = useRef();
    const { addLog } = useLog();

    const [collections, setCollections] = useState([]);
    const [collectionName, setCollectionName] = useState('');
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // const colorByType = {
    //   note: "#4f46e5",
    //   tag: "#10b981",
    //   semantic: "#f59e0b",
    // };

    // Update graph dimensions on window resize
    // useEffect(() => {
    //   const updateSize = () => {
    //     if (containerRef.current) {
    //       const { clientWidth, clientHeight } = containerRef.current;
    //       setDimensions({ width: clientWidth, height: clientHeight });
    //     }
    //   };
    //   updateSize(); // Initial sizing
    //   window.addEventListener('resize', updateSize);
    //   return () => window.removeEventListener('resize', updateSize);
    // }, []);

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



    // Load collections on mount
    useEffect(() => {
        ApiService.getCollections()
            .then((res) => {
                setCollections(res);
                addLog('📦 Loaded collections');
            })
            .catch((e) => {
                addLog(`❌ Failed to load collections: ${e.message || e}`);
            });
    }, [addLog]);

    function getRandomBrightColor() {
        const hue = Math.floor(Math.random() * 360); // hue: 0–360
        return `hsl(${hue}, 100%, 50%)`; // full saturation, medium lightness
    }

    // Load nodes when collection is selected
    useEffect(() => {
        if (!collectionName) return;

        ApiService.listNodes(collectionName)
            .then((nodes) => {
                const formattedNodes = nodes.map((n) => ({
                    id: n.id,
                    label: n.text || n.id,
                    type: n.type || 'note',
                    color: getRandomBrightColor()
                }));

                const validNodeIds = new Set(formattedNodes.map((n) => n.id));
                const links = [];

                for (const node of nodes) {
                    const userLinks = node.user_links || [];
                    for (const targetId of userLinks) {
                        if (validNodeIds.has(node.id) && validNodeIds.has(targetId)) {
                            links.push({ source: node.id, target: targetId });
                        }
                    }
                }

                setGraphData({ nodes: formattedNodes, links });

                addLog(`🧠 Loaded ${nodes.length} nodes for "${collectionName}"`);

                setTimeout(() => {
                    if (fgRef.current) {
                        fgRef.current.zoomToFit(700, 200)


                    }
                }, 100);
            })
            .catch((e) => {
                addLog(`❌ Failed to load nodes: ${e.message || e}`);
            });
    }, [collectionName, addLog]);


    return (
        <div className="graph-container" ref={containerRef}>
            <div className="graph-header">
                <select
                    id="collection-select"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                >
                    <option value="">select collection</option>
                    {collections.map((col) => (
                        <option key={col.id} value={col.name}>
                            {col.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="graph-view">
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
                        ctx.fillStyle = "white";
                        ctx.fillText(label, node.x + 8, node.y + 4);
                        fgRef.current.d3Force('charge').strength(-100); // increase repulsion

                    }}


                    linkDirectionalParticles={2}
                    linkDirectionalParticleColor={(link) => link.source.color}
                    linkDirectionalParticleSpeed={0.008}


                    linkColor={() => "#ccc"}
                    backgroundColor="#000"

                    onNodeClick={(node) => {

                        fgRef.current.zoomToFit(500, 325, n => n.id === node.id);
                    }}
                />
            </div>
        </div>
    );
}
