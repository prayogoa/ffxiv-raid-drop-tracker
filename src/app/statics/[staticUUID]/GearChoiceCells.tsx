"use client";
import { GearType, PlayerGearChoice, Player } from "@prisma/client";
import { Fragment, useCallback, useOptimistic } from "react";
import { clsx } from "clsx/lite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrCreatePlayerGearChoice, updateGearChoice } from "./actions";
import { TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const gearKeys = [
  "weapon",
  "head",
  "chest",
  "hands",
  "legs",
  "feet",
  "earring",
  "necklace",
  "bracelet",
  "ring1",
  "ring2",
] as const;

export function GearChoiceCells({ playerId }: { playerId: Player["id"] }) {
  const { data: playerGearChoice } = useQuery({
    queryFn: () => getOrCreatePlayerGearChoice(playerId),
    queryKey: [{ scope: "PlayerGearChoice", playerId }],
  });
  if (!playerGearChoice) {
    return null;
  }
  return gearKeys.map((key) => (
    <GearCell
      key={key}
      playerId={playerId}
      partKey={key}
      obtainedKey={`${key}Obtained`}
      selectedGear={playerGearChoice?.[key] ?? undefined}
      obtained={playerGearChoice?.[`${key}Obtained`] ?? false}
    />
  ));
}

export const GearCell = ({
  playerId,
  partKey,
  obtainedKey,
  selectedGear,
  obtained,
}: {
  playerId: Player["id"];
  partKey: (typeof gearKeys)[number];
  obtainedKey: `${(typeof gearKeys)[number]}Obtained`;
  selectedGear: GearType | undefined;
  obtained: boolean;
}) => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: (updates: Parameters<typeof updateGearChoice>[1]) =>
      updateGearChoice(playerId, updates),
    onMutate: async (newValues) => {
      const queryKey = [{ scope: "PlayerGearChoice", playerId }] as const;
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previous = queryClient.getQueryData<PlayerGearChoice>(queryKey);
      queryClient.setQueryData(queryKey, { ...previous, ...newValues });
      return { previous, playerId };
    },
    onError: (err, newValues, context) => {
      context &&
        queryClient.setQueryData(
          [{ scope: "PlayerGearChoice", playerId: context.playerId }],
          context.previous,
        );
    },
    onSettled: (_0, _1, _2, context) => {
      context &&
        queryClient.invalidateQueries({
          queryKey: [{ scope: "PlayerGearChoice", playerId: context.playerId }],
        });
    },
  });
  const onCheckedChange = useCallback(
    (checked: boolean) => {
      mutateAsync({ [obtainedKey]: checked });
    },
    [mutateAsync, obtainedKey],
  );
  const onTypeSelected = useCallback(
    (newType: GearType) => {
      mutateAsync({ [partKey]: newType });
    },
    [partKey, mutateAsync],
  );
  return (
    <Fragment key={partKey}>
      <TableCell className="flex items-center justify-end xl:table-cell">
        <Label className="mr-1 h-min xl:hidden">{partKey}:</Label>
        <Select
          name={partKey}
          value={selectedGear || "Raid"}
          onValueChange={onTypeSelected}
        >
          <SelectTrigger
            className={clsx(
              obtained && "bg-green-300 dark:bg-emerald-900",
              "h-10 w-14",
            )}
          >
            <SelectValue>{(selectedGear || "Raid")[0]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GearType).map(([key, value]) => (
              <SelectItem value={key} key={key}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="flex w-fit items-center p-0 xl:table-cell">
        <Checkbox
          name={obtainedKey}
          checked={obtained}
          onCheckedChange={onCheckedChange}
        />
      </TableCell>
    </Fragment>
  );
};
