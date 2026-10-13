export interface ReferenceCountry {
  slug: string;
  name: string;
  focus: string;
}

export const REFERENCE_COUNTRIES: ReferenceCountry[] = [
  { slug: "united-states", name: "United States of America", focus: "North American scale, extent and geographic context" },
  { slug: "canada", name: "Canada", focus: "high-latitude extent and continental scale" },
  { slug: "mexico", name: "Mexico", focus: "North American latitude span and regional context" },
  { slug: "brazil", name: "Brazil", focus: "South American scale and equatorial context" },
  { slug: "argentina", name: "Argentina", focus: "north-south extent in southern South America" },
  { slug: "chile", name: "Chile", focus: "long north-south shape and Pacific context" },
  { slug: "colombia", name: "Colombia", focus: "equatorial and northern South American context" },
  { slug: "peru", name: "Peru", focus: "Andean and Pacific-side geographic context" },
  { slug: "united-kingdom", name: "United Kingdom", focus: "island geography and European position" },
  { slug: "france", name: "France", focus: "Western European extent and centroid context" },
  { slug: "germany", name: "Germany", focus: "central European geographic position" },
  { slug: "spain", name: "Spain", focus: "Iberian Peninsula extent and latitude context" },
  { slug: "italy", name: "Italy", focus: "Mediterranean peninsula shape and extent" },
  { slug: "norway", name: "Norway", focus: "high-latitude and elongated coastal context" },
  { slug: "sweden", name: "Sweden", focus: "Scandinavian north-south extent" },
  { slug: "poland", name: "Poland", focus: "central/eastern European position" },
  { slug: "ukraine", name: "Ukraine", focus: "eastern European extent and centroid context" },
  { slug: "turkey", name: "Turkey", focus: "transcontinental geographic context" },
  { slug: "india", name: "India", focus: "South Asian scale and tropical latitude context" },
  { slug: "china", name: "China", focus: "East Asian continental scale and extent" },
  { slug: "japan", name: "Japan", focus: "island-chain extent and Pacific context" },
  { slug: "south-korea", name: "South Korea", focus: "Korean Peninsula geographic context" },
  { slug: "indonesia", name: "Indonesia", focus: "equatorial archipelago extent" },
  { slug: "philippines", name: "Philippines", focus: "tropical archipelago geographic context" },
  { slug: "australia", name: "Australia", focus: "continental-country scale and southern latitude context" },
  { slug: "new-zealand", name: "New Zealand", focus: "South Pacific island extent" },
  { slug: "south-africa", name: "South Africa", focus: "southern African extent and centroid context" },
  { slug: "egypt", name: "Egypt", focus: "North African latitude and longitude context" },
  { slug: "nigeria", name: "Nigeria", focus: "West African scale and tropical position" },
  { slug: "saudi-arabia", name: "Saudi Arabia", focus: "Arabian Peninsula scale and desert-region context" },
];

export const referenceCountryBySlug = new Map(REFERENCE_COUNTRIES.map((c) => [c.slug, c]));
