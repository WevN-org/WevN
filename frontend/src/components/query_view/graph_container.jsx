import { motion } from "framer-motion";
import clsx from "clsx";

export default function GraphContainer({ visible, children }) {
    return (
        <motion.div
            animate={{ width: visible ? "60%" : "0%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={clsx(
                "overflow-hidden flex flex-col items-center justify-center rounded-xl"
            )}
        >
            {children}
        </motion.div>
    );
}
