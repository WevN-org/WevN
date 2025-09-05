import { useCallback, useState } from "react";
import { DomainContext } from "./domain_context";
import { useLog } from "../log-context/log_context";
import { toast } from "react-toastify";

export default function DomainProvider({ children }) {
    const [currentDomain, setCurrentDomain] = useState(
        () => localStorage.getItem("currentDomain") || "" // initialize directly
    );
    const { addLog } = useLog();

    const setDomain = useCallback(
        (domainName) => {
            try {
                setCurrentDomain(domainName);
                localStorage.setItem("currentDomain", domainName);

                addLog(`Global Collection Changed to ${domainName}`);
                addLog(`Nodes Updated for - ${domainName}`);
                toast.success(`Fetched nodes for domain - ${domainName}`);
            } catch (err) {
                toast.error(`Something went wrong. ${err}`);
            }
        },
        [addLog]
    );

    return (
        <DomainContext.Provider value={{ currentDomain, setDomain }}>
            {children}
        </DomainContext.Provider>
    );
}
