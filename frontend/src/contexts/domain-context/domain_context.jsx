import { createContext, useContext } from "react";

/**
 * @typedef {Object} DomainContextType
 * @property {string|null} currentDomain
 * @property {(domain: string) => void} setDomain
 */
export const DomainContext = createContext({
    currentDomain: null,
    setDomain: () => { },
});

/**
 * Custom hook to consume the DomainContext
 * @returns {DomainContextType}
 */
export function useDomain() {
    return useContext(DomainContext);
}
