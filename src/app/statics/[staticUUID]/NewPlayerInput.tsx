"use client";
import { Role, PlayerStatic, Player } from "@prisma/client";
import { useId } from "react";
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
  const queryClient = useQueryClient();
  const { mutate, isPending, variables } = useMutation({
    mutationFn: async ({
      name,
      role,
      staticUUID,
    }: {
      name: Player["name"];
      role: Role;
      staticUUID: PlayerStatic["slug"];
    }) => {
      const { data: player, error } = await createPlayer(
        name,
        role,
        staticUUID,
      );
      if (!!error) {
        throw new Error(error);
      }
      return player;
    },
    onError: (err) => {
      toast({
        description: err.message,
        variant: "destructive",
      });
    },
    onSuccess: (newPlayer, { staticUUID }, context) => {
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
  const formId = useId();
  const form = useForm<z.infer<typeof createPlayerFormValidator>>({
    resolver: zodResolver(createPlayerFormValidator),
    defaultValues: { name: "", role: "Tank" },
  });

  function onSubmit({ name, role }: z.infer<typeof createPlayerFormValidator>) {
    mutate({ name, role, staticUUID });
  }
  function onInvalid() {
    toast({
      description: "Name can't be empty",
      variant: "destructive",
    });
  }
  return (
    <>
      {isPending && (
        <TableRow>
          <TableCell className="text-center">{variables.name}</TableCell>
          <TableCell>
            <div className="px-3 py-2">{variables.role}</div>
          </TableCell>
        </TableRow>
      )}
      <Form {...form}>
        <TableRow>
          <TableCell>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} id={formId}>
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
            <Button
              variant="ghost"
              type="submit"
              form={formId}
              isLoading={isPending}
            >
              +
            </Button>
          </TableCell>
        </TableRow>
      </Form>
    </>
  );
}
