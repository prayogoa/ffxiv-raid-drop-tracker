"use client";
import { Role, PlayerStatic, Player } from "@prisma/client";
import { useRef, useCallback, useOptimistic, useTransition } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPlayer } from "./actions";
import { createPlayerFormValidator } from "./validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

export function NewPlayerInput({
  staticUUID,
}: {
  staticUUID: PlayerStatic["slug"];
}) {
  const [_, startTransition] = useTransition();
  const [optimisticData, setOptimisticData] = useOptimistic<{
    name: string;
    role: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async ({
      name,
      role,
      staticUUID,
    }: {
      name: Player["name"];
      role: Role;
      staticUUID: PlayerStatic["slug"];
    }) => {
      startTransition(() => setOptimisticData({ name, role }));
      try {
        const player = await createPlayer(name, role, staticUUID);
        console.log(player);
        return player;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    onSettled: (newPlayer, _1, { staticUUID }, context) => {
      queryClient.invalidateQueries({
        queryKey: [{ scope: "PlayerList", staticUUID }],
      });
      if (!!newPlayer) {
        queryClient.setQueryData(
          [{ scope: "Player", playerId: newPlayer.id }],
          newPlayer,
        );
      }
    },
  });
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<z.infer<typeof createPlayerFormValidator>>({
    resolver: zodResolver(createPlayerFormValidator),
    defaultValues: { name: "", role: "Tank" },
  });

  async function onSubmit({
    name,
    role,
  }: z.infer<typeof createPlayerFormValidator>) {
    mutateAsync({ name, role: role as Role, staticUUID });
  }
  function onInvalid() {
    toast({
      description: "Name can't be empty",
      variant: "destructive",
    });
  }
  const onClickAdd = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);
  return (
    <>
      {optimisticData && (
        <TableRow>
          <TableCell className="text-center">{optimisticData.name}</TableCell>
          <TableCell>
            <div className="px-3 py-2">{optimisticData.role}</div>
          </TableCell>
        </TableRow>
      )}
      <Form {...form}>
        <TableRow>
          <TableCell>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </TableCell>
          <TableCell>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <Select
                    name="role"
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>{field.value}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(Role).map(([key, value]) => (
                        <SelectItem value={key} key={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </TableCell>
          <TableCell>
            <Button variant="ghost" onClick={onClickAdd}>
              +
            </Button>
          </TableCell>
        </TableRow>
      </Form>
    </>
  );
}
