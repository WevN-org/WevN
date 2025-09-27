import { createContext, useContext } from "react";

/**
 * @typedef {Object} DomainsListContextType
 * @property {Array} domains - List of available domains
 * @property {Function} setDomains - Function to set the domains array
 */

export const DomainsListContext = createContext({
  domains: [],
  setDomains: () => {},
});

/**
 * Hook to consume the DomainsListContext
 * @returns {DomainsListContextType}
 */
export function useDomainsList() {
  return useContext(DomainsListContext);
}
