import { MAJOR_CITIES } from "./cities";
import { distanceKm, normLng } from "@/lib/geo";

export type StudySlug =
  | "most-isolated-major-cities"
  | "major-city-density-within-500km"
  | "closest-major-cities-to-antipodes";

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
