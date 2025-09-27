import React, { useState, useEffect } from "react";
import { LinksContext } from "./link_context";
import { useDomainsList } from "../domans-list-context/domains_list_context";

const DEFAULT_DISTANCE_THRESHOLD = 1.4;
const DEFAULT_MAX_LINKS = 10;
const LOCAL_STORAGE_KEY = "links_settings_per_domain";

export function LinksProvider({ children }) {
  const { domains } = useDomainsList(); // consume domain list directly
  const [domainLinks, setDomainLinks] = useState({});

  // Update domainLinks whenever domains change
 useEffect(() => {
  if (domains.length === 0) return;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  let parsed = {};
  if (stored) {
    try {
      parsed = JSON.parse(stored);
    } catch (err) {
      console.error("Failed to parse links_settings_per_domain", err);
    }
  }

  const updatedLinks = {};

  domains.forEach(({ id, name }) => {
    updatedLinks[id] = parsed[id] || {
      distance_threshold: DEFAULT_DISTANCE_THRESHOLD,
      max_links: DEFAULT_MAX_LINKS,
      name,
    };
  });

  setDomainLinks(updatedLinks);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLinks));
}, [domains]);

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
