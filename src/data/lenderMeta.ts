export interface LenderMeta {
  /** Primary domain — used for Clearbit logo API and Google favicon */
  logoDomain: string;
  brandColor: string;
  website: string;
}

export const LENDER_META: Record<string, LenderMeta> = {
  // High street — all have Clearbit entries under their .com or primary domain
  hsbc:               { logoDomain: "hsbc.com",                       brandColor: "#DB0011", website: "hsbc.co.uk" },
  lloyds:             { logoDomain: "lloydsbank.com",                 brandColor: "#006A4D", website: "lloydsbank.com" },
  halifax:            { logoDomain: "halifax.co.uk",                  brandColor: "#004B87", website: "halifax.co.uk" },
  natwest:            { logoDomain: "natwest.com",                    brandColor: "#5B0069", website: "natwest.com" },
  barclays:           { logoDomain: "barclays.com",                   brandColor: "#00AEEF", website: "barclays.co.uk" },
  santander:          { logoDomain: "santander.com",                  brandColor: "#EC0000", website: "santander.co.uk" },
  tsb:                { logoDomain: "tsb.co.uk",                      brandColor: "#009FBD", website: "tsb.co.uk" },

  // Building societies
  nationwide:         { logoDomain: "nationwide.co.uk",               brandColor: "#1B3F8E", website: "nationwide.co.uk" },
  skipton:            { logoDomain: "skipton.co.uk",                  brandColor: "#00395A", website: "skipton.co.uk" },
  coventry:           { logoDomain: "coventrybuildingsociety.co.uk",  brandColor: "#0090D0", website: "coventrybuildingsociety.co.uk" },
  leeds:              { logoDomain: "leedsbuildingsociety.co.uk",     brandColor: "#004C8B", website: "leedsbuildingsociety.co.uk" },
  yorkshire:          { logoDomain: "ybs.co.uk",                      brandColor: "#0D2E5E", website: "ybs.co.uk" },
  principality:       { logoDomain: "principality.co.uk",             brandColor: "#00A651", website: "principality.co.uk" },

  // Challengers
  virgin_money:       { logoDomain: "virginmoney.com",                brandColor: "#E2001A", website: "uk.virginmoney.com" },
  metro_bank:         { logoDomain: "metrobank.co.uk",                brandColor: "#CD0039", website: "metrobank.co.uk" },
  aldermore:          { logoDomain: "aldermore.co.uk",                brandColor: "#3C3C8F", website: "aldermore.co.uk" },

  // Intermediary-only
  accord:             { logoDomain: "accordmortgages.co.uk",          brandColor: "#4F35CC", website: "accordmortgages.co.uk" },
  platform:           { logoDomain: "platformhomeloans.co.uk",        brandColor: "#0E5D8A", website: "platformhomeloans.co.uk" },
  bm_solutions:       { logoDomain: "bmsolutions.co.uk",              brandColor: "#006A4D", website: "bmsolutions.co.uk" },
  the_mortgage_works: { logoDomain: "themortgageworks.co.uk",         brandColor: "#1B3F8E", website: "themortgageworks.co.uk" },

  // Specialist / adverse
  kensington:         { logoDomain: "kensingtonmortgages.co.uk",      brandColor: "#00A99D", website: "kensingtonmortgages.co.uk" },
  precise:            { logoDomain: "precisemortgages.co.uk",         brandColor: "#E31837", website: "precisemortgages.co.uk" },
  foundation:         { logoDomain: "foundationhomeloans.co.uk",      brandColor: "#203864", website: "foundationhomeloans.co.uk" },
  pepper_money:       { logoDomain: "peppermoney.co.uk",              brandColor: "#FF4700", website: "peppermoney.co.uk" },
  bluestone:          { logoDomain: "bluestonemortgages.co.uk",       brandColor: "#0052CC", website: "bluestonemortgages.co.uk" },

  // BTL specialists
  kent_reliance:      { logoDomain: "kentreliance.co.uk",             brandColor: "#009FBD", website: "kentreliance.co.uk" },
  paragon:            { logoDomain: "paragonbank.co.uk",              brandColor: "#1B4074", website: "paragonbank.co.uk" },
  fleet:              { logoDomain: "fleetmortgages.co.uk",           brandColor: "#0066CC", website: "fleetmortgages.co.uk" },
  landbay:            { logoDomain: "landbay.co.uk",                  brandColor: "#1E3A5F", website: "landbay.co.uk" },
  keystone:           { logoDomain: "keystonepropertyfinance.co.uk",  brandColor: "#2C5282", website: "keystonepropertyfinance.co.uk" },
};

export function getLenderMeta(id: string): LenderMeta {
  return LENDER_META[id] ?? { logoDomain: "", brandColor: "#4F35CC", website: "" };
}

/** Returns ordered list of logo URL candidates to try (Clearbit → Google → DuckDuckGo) */
export function getLogoSources(domain: string): string[] {
  if (!domain) return [];
  return [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];
}
