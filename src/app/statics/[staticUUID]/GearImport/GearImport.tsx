import { Player, Prisma } from "@prisma/client";
import { Dispatch, forwardRef, SetStateAction, useState } from "react";
import { ArrowDownOnSquareIcon } from "@heroicons/react/16/solid";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateGearChoice } from "../actions";
import {
  getJobItems,
  getSetData,
  mapGearChoice,
  urlValidator as xivGearUrlValidator,
} from "@/lib/xivGear";

const formSchema = z.object({
  url: xivGearUrlValidator,
});

const GearImport = forwardRef<
  HTMLButtonElement,
  { player: Player; className?: string }
>(({ player, className }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationKey: [
      { scope: "PlayerGearChoice", playerId: player.id, source: "GearImport" },
    ],
    mutationFn: async ({ xivGearUUID }: { xivGearUUID: string }) => {
      const setData = await getSetData(xivGearUUID);
      const jobItems = await queryClient.fetchQuery({
        queryKey: [{ scope: "JobItemAquisitions", job: setData.job }],
        queryFn: async ({ queryKey: [{ job }] }) => getJobItems(job),
        staleTime: Infinity,
      });
      return updateGearChoice(player.id, mapGearChoice(setData, jobItems));
    },
    onError: (error) => {
      form.setError("url", { message: error.message });
    },
    onSuccess: (newPlayerGearChoice) => {
      queryClient.setQueryData(
        [{ scope: "PlayerGearChoice", playerId: player.id }],
        newPlayerGearChoice,
      );
      form.reset();
      setIsOpen(false);
    },
  });
  const onSubmit = ({ url: xivGearUUID }: z.output<typeof formSchema>) => {
    mutate({ xivGearUUID });
  };
  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) {
          setIsOpen(open);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button ref={ref} className={className} variant="ghost" size="icon">
          <ArrowDownOnSquareIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Gear</DialogTitle>
          <DialogDescription>Paste XIV Gear Link</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Url:</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus
                      placeholder="https://xivgear.app/?page=sl%7C6f256693-2f25-4b93-bf3e-02f4e9663359"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    example:
                    https://xivgear.app/?page=sl%7C6f256693-2f25-4b93-bf3e-02f4e9663359
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="my-2 w-fit self-end"
              isLoading={isPending}
            >
              Import
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

GearImport.displayName = "GearImport";

export { GearImport };
