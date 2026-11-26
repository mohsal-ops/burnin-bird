// Meat market ("Butcher counter", /market): raw cuts sold by the pound, next to
// the restaurant menu, in the same cart and checkout. No schema of its own:
//  - a menu category (Types) named "Meat Market" or "Butcher" holds the cuts;
//  - each cut's price is its 1 lb price;
//  - a required option group titled "Weight" holds the weights ("1 lb", "1.5 lb",
//    "2 lb"...), each priced as the extra over 1 lb, so cart and checkout price
//    it exactly like any other option (prices always come from the database);
//  - an optional group titled "Cut" / "How should we cut it?" (free options);
//  - items in the category without a Weight group are fixed-price boxes.
// Pure helpers, safe on server and client.

export const MARKET_CATEGORY = /meat\s*market|butcher/i;
export const isWeightGroup = (title: string) => /weight|\bpounds?\b|\blbs?\b/i.test(title);
export const isCutGroup = (title: string) => /\bcut\b|prep/i.test(title);

/** "2.5 lb" -> 2.5 */
export function lbOf(label: string): number | null {
  const m = label.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound)/i);
  return m ? parseFloat(m[1]) : null;
}

export const ANIMALS = ["Lamb", "Goat", "Beef", "Veal", "Chicken", "Turkey", "Fish"] as const;
export type Animal = (typeof ANIMALS)[number] | "More";

export function animalOf(name: string, description = ""): Animal {
  const t = `${name} ${description}`.toLowerCase();
  if (/lamb|mutton/.test(t)) return "Lamb";
  if (/goat/.test(t)) return "Goat";
  if (/veal/.test(t)) return "Veal";
  if (/beef|steak|ribeye|brisket|kofta|kafta|ground/.test(t)) return "Beef";
  if (/chicken|wing|drumstick|thigh|breast/.test(t)) return "Chicken";
  if (/turkey/.test(t)) return "Turkey";
  if (/fish|salmon|shrimp|tilapia|snapper/.test(t)) return "Fish";
  return "More";
}

export type MarketOption = { id: string; label: string; priceInCents: number; lb: number | null };
export type MarketCut = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  pricePerLbCents: number;
  animal: Animal;
  weight: { groupId: string; options: MarketOption[] } | null;
  style: { groupId: string; title: string; options: MarketOption[] } | null;
  extraRequired: boolean; // other required groups the page can't show: send to the menu instead
};
