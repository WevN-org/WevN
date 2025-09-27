import React, { useState, useEffect } from "react";
import { LinksContext } from "./link_context";

const DEFAULT_DISTANCE_THRESHOLD = 1.4;
const DEFAULT_MAX_LINKS = 10;
const LOCAL_STORAGE_KEY = "links_settings_per_domain";

export function LinksProvider({ children, domainList }) {
  // { [domainId]: { distance_threshold, max_links, name } }
  const [domainLinks, setDomainLinks] = useState({});

  // Add new domains if domainList changes
  useEffect(() => {
    setDomainLinks((prev) => {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let parsed = {};
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (err) {
          console.error("Failed to parse links_settings_per_domain", err);
        }
      }

      const updated = { ...prev };

      domainList.forEach(({ id, name }) => {
        if (!updated[id]) {
          updated[id] = parsed[id] || {
            distance_threshold: DEFAULT_DISTANCE_THRESHOLD,
            max_links: DEFAULT_MAX_LINKS,
            name,
          };
        }
      });

      // Only write to localStorage if there is a change
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [domainList]);

  // Update threshold/maxLinks for a specific domain
  const setLinksForDomain = (domainId, distance_threshold, max_links) => {
    setDomainLinks((prev) => {
      const updated = {
        ...prev,
        [domainId]: {
          ...prev[domainId],
          distance_threshold,
          max_links,
        },
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <LinksContext.Provider value={{ domainLinks, setLinksForDomain }}>
      {children}
    </LinksContext.Provider>
  );
}
