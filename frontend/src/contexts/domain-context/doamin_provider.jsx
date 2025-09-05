import { useCallback, useEffect, useState } from "react";
import { DomainContext } from "./domain_context";
import { useLog } from "../log-context/log_context";
import { toast } from "react-toastify";

export default function DomainProvider({ children }) {
    const [currentDomain, sDomain] = useState("")
    const { addLog } = useLog();

    const setDomain = useCallback(
        async(domainName) => {
            try {
                sDomain(domainName);
                localStorage.setItem("currentDomain", domainName)
                addLog(`Global Collection Changed to ${domainName}`)
                addLog(`Nodes Updated for - ${domainName}`)
                toast.success(`Fetched nodes for domain - ${domainName}`)

            }
            catch (err) {
                toast.error(`Something went wrong. ${err}`)
            }
        }, [addLog]);

    useEffect(
        () => {
            const savedDomain = localStorage.getItem("currentDomain");
            if (savedDomain) {
                setDomain(savedDomain)

            }
        }, [setDomain])

    return (
        <DomainContext.Provider value={{ currentDomain, setDomain }}>
            {children}
        </DomainContext.Provider>
    )
}


