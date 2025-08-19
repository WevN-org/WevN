import clsx from "clsx";

export default function GraphContainer({ visible, children }) {
    return (
        <div
            className={clsx(
                "overflow-hidden flex flex-col items-center justify-center rounded-xl transition-all duration-500 ease-in-out",
                visible
                    ? "w-full flex-1 md:w-3/5" // 100% on mobile, 60% on desktop
                    : "w-0 opacity-0"             // collapsed
            )}
        >
            {children}
        </div>
    );
}
