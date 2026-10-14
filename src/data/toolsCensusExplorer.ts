import type { ToolDef } from "@/lib/registry";

export const CENSUS_EXPLORER_TOOLS: ToolDef[] = [
  {
    slug: "us-county-demographic-explorer",
    name: "U.S. County Demographic Explorer",
    short: "Compare every county in a state by population, income, density, poverty, education and home value.",
    intro: "Choose a U.S. state to load current Census county polygons joined to recent ACS 5-year estimates. Switch the choropleth metric, click counties for details, search by county or FIPS, sort the table, and export the statewide dataset to CSV.",
    category: "population",
    scope: "US focused",
    component: "countyexplorer",
    keywords: ["county demographic map", "us county demographics", "county population map", "county income map", "county fips explorer", "census county map"],
    popular: true,
    faq: [
      ["How many counties does the explorer cover?", "It loads every Census county or county-equivalent returned for the selected state, including state-equivalent geography such as parishes and boroughs where applicable."],
      ["Where do the demographic values come from?", "Population, income, age, poverty, education, housing and home-value context use recent American Community Survey 5-year county estimates."],
      ["Can I compare counties visually?", "Yes. Change the map metric to population, median household income, population density, poverty rate, bachelor's-or-higher rate or median home value."],
      ["Can I download the data?", "Yes. The county table can be exported to CSV with FIPS and the displayed demographic fields."],
      ["Are ACS rankings exact?", "No. ACS values are estimates with margins of error, so small differences between counties should not be interpreted as exact rankings for formal decisions."],
    ],
    howTo: ["Choose a state.", "Select a demographic metric for the choropleth map.", "Click or search a county to inspect its profile.", "Sort the county table and download CSV if needed."],
    related: ["address-to-county-lookup", "what-county-am-i-in", "population-within-radius", "cities-within-radius"],
    method: "MapBench loads current county geometry from U.S. Census Bureau TIGERweb and joins it by state+county FIPS to 2020–2024 ACS 5-year county estimates. The visualization is exploratory; ACS estimates and their published margins of error should be used for formal statistical comparisons.",
  },
];
