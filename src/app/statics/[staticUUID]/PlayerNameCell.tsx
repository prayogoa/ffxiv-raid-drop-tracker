"use client";

import { useState } from "react";
import { Player } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  XMarkIcon,
  PencilSquareIcon,
} from "@heroicons/react/16/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updatePlayer } from "./actions";
import { GearImport } from "./GearImport";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { TableCell } from "@/components/ui/table";

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
    mutateAsync(values).then(onClose);
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

function PlayerNameCell({ player }: { player?: Player }) {
  const [isEditing, setIsEditing] = useState(false);
  let content;
  if (player) {
    content = isEditing ? (
      <PlayerNameEdit
        name={player.name}
        playerId={player.id}
        onClose={() => setIsEditing(false)}
      />
    ) : (
      <>
        <span className="block grow px-3 py-2 text-center">{player.name}</span>
        <GearImport
          className="invisible ms-auto p-1 group-hover:visible"
          player={player}
        />
        <Button
          variant="ghost"
          size="icon"
          className="invisible ms-1 p-1 group-hover:visible"
          onClick={() => setIsEditing(true)}
        >
          <PencilSquareIcon className="h-4 w-4" />
        </Button>
      </>
    );
  } else {
  }

  return (
    <TableCell className="col-span-2 row-start-1 block xl:table-cell">
      <div className="group flex w-full flex-row items-center">{content}</div>
    </TableCell>
  );
}

export { PlayerNameCell };
