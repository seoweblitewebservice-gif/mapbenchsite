import { MAJOR_CITIES } from "./cities";
import { distanceKm, normLng } from "@/lib/geo";
import { countryStudyExport } from "./countryStudies";

export type StudySlug =
  | "most-isolated-major-cities"
  | "major-city-density-within-500km"
  | "closest-major-cities-to-antipodes"
  | "closest-major-city-pairs"
  | "farthest-major-city-pairs"
  | "major-cities-closest-to-equator"
  | "major-cities-closest-to-prime-meridian"
  | "major-city-population-within-1000km"
  | "largest-country-geometries"
  | "widest-country-longitude-spans"
  | "northernmost-country-centroids";

export interface StudyMeta {
  slug: StudySlug;
  title: string;
  description: string;
  date: string;
  question: string;
}

export const STUDIES: StudyMeta[] = [
  {
    slug: "most-isolated-major-cities",
    title: "The Most Isolated Major Cities in MapBench's World-City Dataset",
    description: "Which major cities sit farthest from their nearest peer? We compare every city with every other city using great-circle distance.",
    date: "2026-10-13",
    question: "Which major city in the dataset is farthest from the nearest other major city?",
  },
  {
    slug: "major-city-density-within-500km",
    title: "Which Major Cities Have the Most Other Major Cities Within 500 km?",
    description: "A transparent comparison of major-city clustering using a fixed 500 km great-circle radius and the same curated city dataset used by MapBench tools.",
    date: "2026-10-13",
    question: "Which cities have the largest number of dataset peers within a 500 km radius?",
  },
  {
    slug: "closest-major-cities-to-antipodes",
    title: "Which Major Cities Have Another Major City Closest to Their Antipode?",
    description: "For every city we calculate the exact opposite point on Earth, then find the nearest city in the MapBench major-city dataset.",
    date: "2026-10-13",
    question: "Which city antipodes land closest to another major city in the dataset?",
  },
  {
    slug: "closest-major-city-pairs",
    title: "The Closest Major-City Pairs in the MapBench Dataset",
    description: "We calculate every unique city-to-city pair and rank the shortest great-circle separations.",
    date: "2026-10-14",
    question: "Which two major cities in the dataset have the smallest great-circle separation?",
  },
  {
    slug: "farthest-major-city-pairs",
    title: "The Farthest Major-City Pairs in the MapBench Dataset",
    description: "A pairwise comparison of the longest great-circle separations between cities in the curated world-city dataset.",
    date: "2026-10-14",
    question: "Which city pairs in the dataset lie farthest apart on the Earth's surface?",
  },
  {
    slug: "major-cities-closest-to-equator",
    title: "Which Major Cities Sit Closest to the Equator?",
    description: "We rank city-centre coordinates by their north-south great-circle distance from 0° latitude.",
    date: "2026-10-14",
    question: "Which major-city centres in the dataset are closest to the Equator?",
  },
  {
    slug: "major-cities-closest-to-prime-meridian",
    title: "Which Major Cities Sit Closest to the Prime Meridian?",
    description: "We compare city-centre longitudes with 0° and convert the angular separation into an approximate surface distance at each latitude.",
    date: "2026-10-14",
    question: "Which major-city centres in the dataset sit closest to the Greenwich Prime Meridian?",
  },
  {
    slug: "major-city-population-within-1000km",
    title: "Which Major Cities Have the Largest Dataset Population Within 1,000 km?",
    description: "We sum the approximate populations attached to peer cities inside a fixed 1,000 km great-circle radius.",
    date: "2026-10-14",
    question: "Which city has the largest summed peer-city population within 1,000 km in this dataset?",
  },
  {
    slug: "largest-country-geometries",
    title: "Largest Country Geometries in the MapBench World Dataset",
    description: "A reproducible ranking of country polygon areas calculated from the generalized world-atlas/Natural Earth geometry used by MapBench maps.",
    date: "2026-10-14",
    question: "Which country polygons have the largest spherical area in the MapBench world geometry dataset?",
  },
  {
    slug: "widest-country-longitude-spans",
    title: "Which Countries Span the Most Longitude?",
    description: "We compare country bounding boxes in the world-atlas/Natural Earth geometry dataset and rank the widest non-antimeridian longitude spans.",
    date: "2026-10-14",
    question: "Which country geometries span the greatest number of longitude degrees in this generalized world dataset?",
  },
  {
    slug: "northernmost-country-centroids",
    title: "Which Countries Have the Northernmost Geographic Centroids?",
    description: "We calculate spherical centroids from generalized country polygons and rank the highest centroid latitudes.",
    date: "2026-10-14",
    question: "Which country geometries have the most northerly spherical centroid in the MapBench world dataset?",
  },
];

export function getStudy(slug: string) {
  return STUDIES.find((s) => s.slug === slug);
}

export function isolationRows(limit = 25) {
  return MAJOR_CITIES.map((city) => {
    const peers = MAJOR_CITIES
      .filter((other) => other !== city)
      .map((other) => ({ other, km: distanceKm(city, other) }))
      .sort((a, b) => a.km - b.km);
    return { city, nearest: peers[0].other, km: peers[0].km };
  })
    .sort((a, b) => b.km - a.km)
    .slice(0, limit);
}

export function density500Rows(limit = 25) {
  return MAJOR_CITIES.map((city) => {
    const peers = MAJOR_CITIES
      .filter((other) => other !== city)
      .map((other) => ({ other, km: distanceKm(city, other) }))
      .filter((x) => x.km <= 500)
      .sort((a, b) => a.km - b.km);
    return {
      city,
      count: peers.length,
      populationThousands: peers.reduce((sum, x) => sum + x.other.pop, 0),
      nearestNames: peers.slice(0, 5).map((x) => x.other.name),
    };
  })
    .sort((a, b) => b.count - a.count || b.populationThousands - a.populationThousands)
    .slice(0, limit);
}

export function antipodeRows(limit = 25) {
  return MAJOR_CITIES.map((city) => {
    const antipode = { lat: -city.lat, lng: normLng(city.lng + 180) };
    const nearest = MAJOR_CITIES
      .filter((other) => other !== city)
      .map((other) => ({ other, km: distanceKm(antipode, other) }))
      .sort((a, b) => a.km - b.km)[0];
    return { city, antipode, nearest: nearest.other, km: nearest.km };
  })
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

export function cityPairRows(order: "asc" | "desc", limit = 25) {
  const rows: { a: (typeof MAJOR_CITIES)[number]; b: (typeof MAJOR_CITIES)[number]; km: number }[] = [];
  for (let i = 0; i < MAJOR_CITIES.length; i++) {
    for (let j = i + 1; j < MAJOR_CITIES.length; j++) {
      rows.push({ a: MAJOR_CITIES[i], b: MAJOR_CITIES[j], km: distanceKm(MAJOR_CITIES[i], MAJOR_CITIES[j]) });
    }
  }
  rows.sort((x, y) => order === "asc" ? x.km - y.km : y.km - x.km);
  return rows.slice(0, limit);
}

export function equatorRows(limit = 25) {
  return MAJOR_CITIES.map((city) => ({ city, km: Math.abs(city.lat) * 111.195 }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

export function primeMeridianRows(limit = 25) {
  return MAJOR_CITIES.map((city) => {
    const lonDistance = Math.abs(normLng(city.lng));
    const km = lonDistance * 111.320 * Math.cos((city.lat * Math.PI) / 180);
    return { city, km: Math.abs(km), longitude: city.lng };
  })
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

export function population1000Rows(limit = 25) {
  return MAJOR_CITIES.map((city) => {
    const peers = MAJOR_CITIES
      .filter((other) => other !== city)
      .map((other) => ({ other, km: distanceKm(city, other) }))
      .filter((x) => x.km <= 1000);
    return {
      city,
      count: peers.length,
      populationThousands: peers.reduce((sum, x) => sum + x.other.pop, 0),
      examples: peers.sort((a, b) => a.km - b.km).slice(0, 5).map((x) => x.other.name),
    };
  })
    .sort((a, b) => b.populationThousands - a.populationThousands || b.count - a.count)
    .slice(0, limit);
}

export function studyExport(slug: string) {
  const countryExport = countryStudyExport(slug);
  if (countryExport) return countryExport;
  switch (slug) {
    case "most-isolated-major-cities":
      return { headers: ["rank","city","country","nearest_city","distance_km"], rows: isolationRows(100).map((r,i)=>[i+1,r.city.name,r.city.country,r.nearest.name,Math.round(r.km)]) };
    case "major-city-density-within-500km":
      return { headers: ["rank","city","country","peer_count","peer_population_thousands"], rows: density500Rows(100).map((r,i)=>[i+1,r.city.name,r.city.country,r.count,r.populationThousands]) };
    case "closest-major-cities-to-antipodes":
      return { headers: ["rank","origin_city","country","nearest_city_to_antipode","miss_distance_km"], rows: antipodeRows(100).map((r,i)=>[i+1,r.city.name,r.city.country,r.nearest.name,Math.round(r.km)]) };
    case "closest-major-city-pairs":
      return { headers: ["rank","city_a","country_a","city_b","country_b","distance_km"], rows: cityPairRows("asc",100).map((r,i)=>[i+1,r.a.name,r.a.country,r.b.name,r.b.country,Math.round(r.km)]) };
    case "farthest-major-city-pairs":
      return { headers: ["rank","city_a","country_a","city_b","country_b","distance_km"], rows: cityPairRows("desc",100).map((r,i)=>[i+1,r.a.name,r.a.country,r.b.name,r.b.country,Math.round(r.km)]) };
    case "major-cities-closest-to-equator":
      return { headers: ["rank","city","country","latitude","distance_to_equator_km"], rows: equatorRows(100).map((r,i)=>[i+1,r.city.name,r.city.country,r.city.lat,Math.round(r.km)]) };
    case "major-cities-closest-to-prime-meridian":
      return { headers: ["rank","city","country","longitude","approx_distance_to_prime_meridian_km"], rows: primeMeridianRows(100).map((r,i)=>[i+1,r.city.name,r.city.country,r.longitude,Math.round(r.km)]) };
    case "major-city-population-within-1000km":
      return { headers: ["rank","city","country","peer_count","peer_population_thousands"], rows: population1000Rows(100).map((r,i)=>[i+1,r.city.name,r.city.country,r.count,r.populationThousands]) };
    default:
      return null;
  }
}
