export default function GraphContainer({ visible, children }) {
    return (
        <div
            className="graph-container flex flex-col items-center justify-center transition-all duration-500 ease-in-out"
            style={{
                flexBasis: visible ? "60%" : "0%",
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.95)",
                overflow: "hidden",
            }}
        >
            {children}
        </div>
    );
}
