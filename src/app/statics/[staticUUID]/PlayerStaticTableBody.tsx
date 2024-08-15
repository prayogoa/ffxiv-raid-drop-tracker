"use client";

import { useCallback, useState } from "react";
import { PlayerStatic, Player, PrismaClient } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  XMarkIcon,
  PencilSquareIcon,
} from "@heroicons/react/16/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { NewPlayerInput } from "./NewPlayerInput";
import {
  getPlayerListForStatic,
  updatePlayer,
  getPlayer,
  deletePlayer,
} from "./actions";
import { GearChoiceCells } from "./GearChoiceCells";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormField, FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(1),
});

function PlayerNameEdit({
  playerId,
  name,
  onClose,
}: {
  playerId: Player["id"];
  name: Player["name"];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: (values: Parameters<typeof updatePlayer>[1]) =>
      updatePlayer(playerId, values),
    onMutate: async (newValues) => {
      const queryKey = [{ scope: "Player", playerId }] as const;
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previous = queryClient.getQueryData<Player>(queryKey);
      queryClient.setQueryData(queryKey, { ...previous, newValues });
      return { previous, playerId };
    },
    onError: (err, newValues, context) => {
      context &&
        queryClient.setQueryData(
          [{ scope: "Player", playerId: context.playerId }],
          context.previous,
        );
    },
    onSettled: (_0, _1, _2, context) => {
      context &&
        queryClient.invalidateQueries({
          queryKey: [{ scope: "Player", playerId: context.playerId }],
        });
    },
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    updatePlayer(playerId, values).then(onClose);
  }
  function onInvalid() {
    toast({
      description: "Name can't be empty",
      variant: "destructive",
    });
  }

  return (
    <Form {...form}>
      <form
        className="flex w-full items-center"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="grow">
              <FormControl>
                <Input {...field} autoFocus />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" size="icon" className="mx-2" variant="outline">
          <CheckIcon className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="outline" onClick={onClose}>
          <XMarkIcon className="size-4" />
        </Button>
      </form>
    </Form>
  );
}

function PlayerName({
  playerId,
  name,
}: {
  playerId: Player["id"];
  name: Player["name"];
}) {
  const [isEditing, setIsEditing] = useState(false);
  return isEditing ? (
    <PlayerNameEdit
      name={name}
      playerId={playerId}
      onClose={() => setIsEditing(false)}
    />
  ) : (
    <div className="group flex w-full flex-row items-center">
      <span className="block grow px-3 py-2 text-center">{name}</span>
      <Button
        variant="ghost"
        size="icon"
        className="invisible ms-auto cursor-pointer p-1 group-hover:visible"
        onClick={() => setIsEditing(true)}
      >
        <PencilSquareIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
export function PlayerRow({
  playerId,
  staticUUID,
}: {
  playerId: Player["id"];
  staticUUID: PlayerStatic["slug"];
}) {
  const queryClient = useQueryClient();
  const { data: player } = useQuery({
    queryFn: () => getPlayer(playerId),
    queryKey: [{ scope: "Player", playerId }],
  });
  const { mutateAsync } = useMutation({
    mutationFn: (playerId: Player["id"]) => deletePlayer(playerId),
    onMutate: async (playerId) => {
      const queryKey = [{ scope: "PlayerList", staticUUID }];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Player[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previous.filter((player) => player.id !== playerId),
      );
      return { previous, playerId, staticUUID };
    },
    onError: (err, newValues, context) => {
      context &&
        queryClient.setQueryData(
          [{ scope: "PlayerList", staticUUID: context.staticUUID }],
          context.previous,
        );
    },
    onSettled: (_0, _1, _2, context) => {
      context &&
        queryClient.invalidateQueries({
          queryKey: [{ scope: "PlayerList", staticUUID: context.staticUUID }],
        });
    },
  });
  const onClickDelete = useCallback(() => {
    mutateAsync(playerId);
  }, [mutateAsync, playerId]);
  return (
    <TableRow className="grid grid-cols-[repeat(2,1fr_min-content)] xl:table-row">
      <TableCell className="col-span-2 row-start-1 block xl:table-cell">
        {player?.name ? (
          <PlayerName name={player.name} playerId={playerId} />
        ) : (
          <Skeleton />
        )}
      </TableCell>
      <TableCell className="row-start1 col-span-1 block xl:table-cell">
        <div className="px-3 py-2">{player?.role || <Skeleton />}</div>
      </TableCell>
      <GearChoiceCells playerId={playerId} />
      <TableCell className="col-span-1 col-start-4 row-start-1 block xl:table-cell">
        <form action={onClickDelete}>
          <Button variant="ghost" className="w-fit" type="submit" size="icon">
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );
}

export default function PlayerStaticTableBody({
  staticUUID,
}: {
  staticUUID: PlayerStatic["slug"];
}) {
  const { data: players } = useQuery({
    queryKey: [{ scope: "PlayerList", staticUUID }],
    queryFn: () => getPlayerListForStatic(staticUUID),
  });
  if (players === undefined) {
    return null;
  }
  return (
    <>
      {players.map((player) => (
        <PlayerRow
          key={player.id}
          playerId={player.id}
          staticUUID={staticUUID}
        />
      ))}
      <NewPlayerInput staticUUID={staticUUID} />
    </>
  );
}
