import clsx from "clsx";
import ForceGraph2D from 'react-force-graph-2d';

export default function GraphContainer({ isVisible, children }) {
    return (
        <div
            className={clsx(
                "overflow-hidden flex flex-col items-center justify-center rounded-xl transition-all duration-500 ease-in-out origin-top md:origin-right",
                isVisible
                    ? "w-full flex-1 md:w-3/5 opacity-100" // 100% on mobile, 60% on desktop
                    : "w-0 opacity-0 flex-0"             // collapsed
            )}
        >
            {children}
        </div>
    );
}
