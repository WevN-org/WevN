import { createContext, useContext } from "react";

/**
 * Context for managing nodes globally.
 * @typedef {Object} LinksContextType
 * @property {number} distance_threshold - The distance threshold for semantic linking context for concepts
 * @property {number} max_links - The maximum number of links that can be semantically connected
 * @property {(distance_threshold: number, max_links: number) => void} setLinks - Function to update the link values.
 */

export const LinksContext = createContext({
  distance_threshold: 1.4,
  max_links: 10,
  setLinks: () => {},
});

/**
 * Hook to consume the LinksContext
 * @returns {LinksContextType}
 */
export function useLinks() {
  return useContext(LinksContext);
}
