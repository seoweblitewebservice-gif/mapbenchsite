// Per-state reference facts for blank-map pages.
// Sources: state capitals from MapBench's computed coast-distance dataset (Wikipedia/Wikidata coords);
// populations = US Census Vintage 2024 estimates (NST-EST2024-POP); land areas = US Census 2024 Gazetteer;
// county counts = computed from 2024 Gazetteer county file; largest cities = Wikipedia
// "List of largest cities of U.S. states and territories by population" (2020 Census figures).

export interface StateFacts {
  capital: string;
  largestCity: string;
  population2024: number;
  landAreaSqMi: number;
  counties: number;
  densityPerSqMi: number;
}

export const STATE_FACTS: Record<string, StateFacts> = {
  "Alabama": { capital: "Montgomery", largestCity: "Huntsville", population2024: 5157699, landAreaSqMi: 50651.0, counties: 67, densityPerSqMi: 101.8 },
  "Alaska": { capital: "Juneau", largestCity: "Anchorage", population2024: 740133, landAreaSqMi: 571241.6, counties: 30, densityPerSqMi: 1.3 },
  "Arizona": { capital: "Phoenix", largestCity: "Phoenix", population2024: 7582384, landAreaSqMi: 113655.4, counties: 15, densityPerSqMi: 66.7 },
  "Arkansas": { capital: "Little Rock", largestCity: "Little Rock", population2024: 3088354, landAreaSqMi: 51991.9, counties: 75, densityPerSqMi: 59.4 },
  "California": { capital: "Sacramento", largestCity: "Los Angeles", population2024: 39431263, landAreaSqMi: 155859.2, counties: 58, densityPerSqMi: 253.0 },
  "Colorado": { capital: "Denver", largestCity: "Denver", population2024: 5957493, landAreaSqMi: 103637.1, counties: 64, densityPerSqMi: 57.5 },
  "Connecticut": { capital: "Hartford", largestCity: "Bridgeport", population2024: 3675069, landAreaSqMi: 4842.5, counties: 9, densityPerSqMi: 758.9 },
  "Delaware": { capital: "Dover", largestCity: "Wilmington", population2024: 1051917, landAreaSqMi: 1948.5, counties: 3, densityPerSqMi: 539.8 },
  "District of Columbia": { capital: "Washington, D.C.", largestCity: "Washington, D.C.", population2024: 702250, landAreaSqMi: 61.1, counties: 1, densityPerSqMi: 11488.6 },
  "Florida": { capital: "Tallahassee", largestCity: "Jacksonville", population2024: 23372215, landAreaSqMi: 53654.8, counties: 67, densityPerSqMi: 435.6 },
  "Georgia": { capital: "Atlanta", largestCity: "Atlanta", population2024: 11180878, landAreaSqMi: 57716.8, counties: 159, densityPerSqMi: 193.7 },
  "Hawaii": { capital: "Honolulu", largestCity: "Honolulu1", population2024: 1446146, landAreaSqMi: 6422.6, counties: 5, densityPerSqMi: 225.2 },
  "Idaho": { capital: "Boise", largestCity: "Boise", population2024: 2001619, landAreaSqMi: 82645.4, counties: 44, densityPerSqMi: 24.2 },
  "Illinois": { capital: "Springfield", largestCity: "Chicago", population2024: 12710158, landAreaSqMi: 55513.1, counties: 102, densityPerSqMi: 229.0 },
  "Indiana": { capital: "Indianapolis", largestCity: "Indianapolis", population2024: 6924275, landAreaSqMi: 35825.1, counties: 92, densityPerSqMi: 193.3 },
  "Iowa": { capital: "Des Moines", largestCity: "Des Moines", population2024: 3241488, landAreaSqMi: 55853.7, counties: 99, densityPerSqMi: 58.0 },
  "Kansas": { capital: "Topeka", largestCity: "Wichita", population2024: 2970606, landAreaSqMi: 81758.6, counties: 105, densityPerSqMi: 36.3 },
  "Kentucky": { capital: "Frankfort", largestCity: "Louisville", population2024: 4588372, landAreaSqMi: 39485.4, counties: 120, densityPerSqMi: 116.2 },
  "Louisiana": { capital: "Baton Rouge", largestCity: "New Orleans", population2024: 4597740, landAreaSqMi: 43212.9, counties: 64, densityPerSqMi: 106.4 },
  "Maine": { capital: "Augusta", largestCity: "Portland", population2024: 1405012, landAreaSqMi: 30845.1, counties: 16, densityPerSqMi: 45.6 },
  "Maryland": { capital: "Annapolis", largestCity: "Baltimore", population2024: 6263220, landAreaSqMi: 9710.9, counties: 24, densityPerSqMi: 645.0 },
  "Massachusetts": { capital: "Boston", largestCity: "Boston", population2024: 7136171, landAreaSqMi: 7801.0, counties: 14, densityPerSqMi: 914.8 },
  "Michigan": { capital: "Lansing", largestCity: "Detroit", population2024: 10140459, landAreaSqMi: 56611.0, counties: 83, densityPerSqMi: 179.1 },
  "Minnesota": { capital: "Saint Paul", largestCity: "Minneapolis", population2024: 5793151, landAreaSqMi: 79631.6, counties: 87, densityPerSqMi: 72.7 },
  "Mississippi": { capital: "Jackson", largestCity: "Jackson", population2024: 2943045, landAreaSqMi: 46924.6, counties: 82, densityPerSqMi: 62.7 },
  "Missouri": { capital: "Jefferson City", largestCity: "Kansas City", population2024: 6245466, landAreaSqMi: 68746.4, counties: 115, densityPerSqMi: 90.8 },
  "Montana": { capital: "Helena", largestCity: "Billings", population2024: 1137233, landAreaSqMi: 145550.3, counties: 56, densityPerSqMi: 7.8 },
  "Nebraska": { capital: "Lincoln", largestCity: "Omaha", population2024: 2005465, landAreaSqMi: 76815.0, counties: 93, densityPerSqMi: 26.1 },
  "Nevada": { capital: "Carson City", largestCity: "Las Vegas", population2024: 3267467, landAreaSqMi: 109860.4, counties: 17, densityPerSqMi: 29.7 },
  "New Hampshire": { capital: "Concord", largestCity: "Manchester", population2024: 1409032, landAreaSqMi: 8953.8, counties: 10, densityPerSqMi: 157.4 },
  "New Jersey": { capital: "Trenton", largestCity: "Newark", population2024: 9500851, landAreaSqMi: 7354.9, counties: 21, densityPerSqMi: 1291.8 },
  "New Mexico": { capital: "Santa Fe", largestCity: "Albuquerque", population2024: 2130256, landAreaSqMi: 121312.7, counties: 33, densityPerSqMi: 17.6 },
  "New York": { capital: "Albany", largestCity: "New York", population2024: 19867248, landAreaSqMi: 47123.4, counties: 62, densityPerSqMi: 421.6 },
  "North Carolina": { capital: "Raleigh", largestCity: "Charlotte", population2024: 11046024, landAreaSqMi: 48624.2, counties: 100, densityPerSqMi: 227.2 },
  "North Dakota": { capital: "Bismarck", largestCity: "Fargo", population2024: 796568, landAreaSqMi: 68994.3, counties: 53, densityPerSqMi: 11.5 },
  "Ohio": { capital: "Columbus", largestCity: "Columbus", population2024: 11883304, landAreaSqMi: 40858.9, counties: 88, densityPerSqMi: 290.8 },
  "Oklahoma": { capital: "Oklahoma City", largestCity: "Oklahoma City", population2024: 4095393, landAreaSqMi: 68596.7, counties: 77, densityPerSqMi: 59.7 },
  "Oregon": { capital: "Salem", largestCity: "Portland", population2024: 4272371, landAreaSqMi: 95996.7, counties: 36, densityPerSqMi: 44.5 },
  "Pennsylvania": { capital: "Harrisburg", largestCity: "Philadelphia", population2024: 13078751, landAreaSqMi: 44742.1, counties: 67, densityPerSqMi: 292.3 },
  "Rhode Island": { capital: "Providence", largestCity: "Providence", population2024: 1112308, landAreaSqMi: 1033.9, counties: 5, densityPerSqMi: 1075.8 },
  "South Carolina": { capital: "Columbia", largestCity: "Charleston", population2024: 5478831, landAreaSqMi: 30064.1, counties: 46, densityPerSqMi: 182.2 },
  "South Dakota": { capital: "Pierre", largestCity: "Sioux Falls", population2024: 924669, landAreaSqMi: 75807.9, counties: 66, densityPerSqMi: 12.2 },
  "Tennessee": { capital: "Nashville", largestCity: "Nashville", population2024: 7227750, landAreaSqMi: 41224.3, counties: 95, densityPerSqMi: 175.3 },
  "Texas": { capital: "Austin", largestCity: "Houston", population2024: 31290831, landAreaSqMi: 261258.6, counties: 254, densityPerSqMi: 119.8 },
  "Utah": { capital: "Salt Lake City", largestCity: "Salt Lake City", population2024: 3503613, landAreaSqMi: 82595.7, counties: 29, densityPerSqMi: 42.4 },
  "Vermont": { capital: "Montpelier", largestCity: "Burlington", population2024: 648493, landAreaSqMi: 9217.3, counties: 14, densityPerSqMi: 70.4 },
  "Virginia": { capital: "Richmond", largestCity: "Virginia Beach", population2024: 8811195, landAreaSqMi: 39481.4, counties: 133, densityPerSqMi: 223.2 },
  "Washington": { capital: "Olympia", largestCity: "Seattle", population2024: 7958180, landAreaSqMi: 66455.4, counties: 39, densityPerSqMi: 119.8 },
  "West Virginia": { capital: "Charleston", largestCity: "Charleston", population2024: 1769979, landAreaSqMi: 24041.2, counties: 55, densityPerSqMi: 73.6 },
  "Wisconsin": { capital: "Madison", largestCity: "Milwaukee", population2024: 5960975, landAreaSqMi: 54168.0, counties: 72, densityPerSqMi: 110.0 },
  "Wyoming": { capital: "Cheyenne", largestCity: "Cheyenne", population2024: 587618, landAreaSqMi: 97088.6, counties: 23, densityPerSqMi: 6.1 },
};

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
