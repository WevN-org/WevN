import { useCallback, useState } from "react";
import { DomainContext } from "./domain_context";
import { toast } from "react-toastify";

export default function DomainProvider({ children }) {
    const [currentDomain, setCurrentDomain] = useState(
        () => localStorage.getItem("currentDomain") || "" // initialize directly
    );

    const setDomain = useCallback(
        (domainName) => {
            try {
                setCurrentDomain(domainName);
                localStorage.setItem("currentDomain", domainName);
            } catch (err) {
                toast.error(`Something went wrong. ${err}`);
            }
        },
        []
    );
    return (
        <DomainContext.Provider value={{ currentDomain, setDomain }}>
            {children}
        </DomainContext.Provider>
    );
}
