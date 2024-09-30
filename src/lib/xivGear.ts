import { z } from "zod";
import { gearKeys } from "./gearKeys";
import { Prisma } from "@prisma/client";
const uuidValidator = z.string().uuid("Invalid set id");
export const urlValidator = z
  .string()
  .url()
  .transform((value, ctx) => {
    const parsed = new URL(value);
    if (parsed.hostname !== "xivgear.app") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide a xivgear link",
      });
      return z.NEVER;
    }
    const { data, error } = uuidValidator.safeParse(
      parsed.searchParams.get("page")?.split("|")[1],
    );
    if (error) {
      error.issues.forEach((issue) => ctx.addIssue(issue));
      return z.NEVER;
    }
    return data;
  });

export type AcquisitionSources =
  | "SavageRaid"
  | "AugTome"
  | "Unknown"
  | "Tome"
  | "Crafted"
  | "Dungeon"
  | "Artifact"
  | "ExtremeTrial"
  | "AugCrafted"
  | "Ultimate";

export type GearSlot =
  | "Weapon"
  | "Body"
  | "Ears"
  | "Feet"
  | "Hand"
  | "Head"
  | "Legs"
  | "Neck"
  | "RingLeft"
  | "RingRight"
  | "Wrist";
export async function getSetData(uuid: string): Promise<any> {
  const setUrl = new URL(`https://api.xivgear.app/shortlink/${uuid}`);
  const resp = await fetch(setUrl);
  if (!resp.ok) {
    throw new Error("Failed to fetch set");
  }
  const setData = await resp.json();
  if (typeof setData !== "object") {
    throw new Error("Please export a single set instead of a sheet");
  }
  return setData;
}

export async function getJobItems(job: string) {
  const jobItemsUrl = new URL(`https://data.xivgear.app/Items?job=${job}`);
  const resp = await fetch(jobItemsUrl);
  if (!resp.ok) {
    throw new Error("Failed to fetch item list");
  }
  const { items } = await resp.json();
  const entries: [number, AcquisitionSources][] = items.map(
    ({
      primaryKey,
      acquisitionSource,
    }: {
      primaryKey: number;
      acquisitionSource: AcquisitionSources;
    }) => [primaryKey, acquisitionSource],
  );
  return Object.fromEntries(entries);
}

const gearMapping = [
  ["Weapon", "weapon"],
  ["Head", "head"],
  ["Body", "chest"],
  ["Hand", "hands"],
  ["Legs", "legs"],
  ["Feet", "feet"],
  ["Ears", "earring"],
  ["Neck", "necklace"],
  ["Wrist", "bracelet"],
  ["RingLeft", "ring1"],
  ["RingRight", "ring2"],
] as const satisfies [GearSlot, (typeof gearKeys)[number]][];
// TODO type set and items
export function mapGearChoice(
  setData: any,
  jobItems: Awaited<ReturnType<typeof getJobItems>>,
) {
  return gearMapping.reduce((res, [theirKey, myKey]) => {
    switch (jobItems[setData.items[theirKey].id]) {
      case "SavageRaid":
        res[myKey] = "Raid";
        break;
      case "AugTome":
        res[myKey] = "Tome";
        break;
      case "Crafted":
      default:
        res[myKey] = "Crafted";
    }
    return res;
  }, {} as Prisma.PlayerGearChoiceUpdateInput);
}
