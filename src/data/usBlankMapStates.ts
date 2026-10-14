export type UsBlankMapState = {
  name: string;
  slug: string;
  fips: string;
  divisionLabel: string;
};

const base: Array<[string, string]> = [
  ["Alabama", "01"], ["Alaska", "02"], ["Arizona", "04"], ["Arkansas", "05"], ["California", "06"],
  ["Colorado", "08"], ["Connecticut", "09"], ["Delaware", "10"], ["District of Columbia", "11"], ["Florida", "12"],
  ["Georgia", "13"], ["Hawaii", "15"], ["Idaho", "16"], ["Illinois", "17"], ["Indiana", "18"], ["Iowa", "19"],
  ["Kansas", "20"], ["Kentucky", "21"], ["Louisiana", "22"], ["Maine", "23"], ["Maryland", "24"], ["Massachusetts", "25"],
  ["Michigan", "26"], ["Minnesota", "27"], ["Mississippi", "28"], ["Missouri", "29"], ["Montana", "30"], ["Nebraska", "31"],
  ["Nevada", "32"], ["New Hampshire", "33"], ["New Jersey", "34"], ["New Mexico", "35"], ["New York", "36"],
  ["North Carolina", "37"], ["North Dakota", "38"], ["Ohio", "39"], ["Oklahoma", "40"], ["Oregon", "41"], ["Pennsylvania", "42"],
  ["Rhode Island", "44"], ["South Carolina", "45"], ["South Dakota", "46"], ["Tennessee", "47"], ["Texas", "48"], ["Utah", "49"],
  ["Vermont", "50"], ["Virginia", "51"], ["Washington", "53"], ["West Virginia", "54"], ["Wisconsin", "55"], ["Wyoming", "56"],
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function divisionLabel(name: string) {
  if (name === "Louisiana") return "parishes";
  if (name === "Alaska") return "boroughs and census areas";
  if (name === "District of Columbia") return "county-equivalent";
  return "counties";
}

export const US_BLANK_MAP_STATES: UsBlankMapState[] = base.map(([name, fips]) => ({
  name,
  slug: slugify(name),
  fips,
  divisionLabel: divisionLabel(name),
}));

export const US_BLANK_MAP_STATE_BY_SLUG = new Map(US_BLANK_MAP_STATES.map((state) => [state.slug, state]));
