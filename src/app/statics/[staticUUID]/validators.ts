import { Prisma, Role } from "@prisma/client";
import { z } from "zod";

export const createPlayerFormValidator = z.object({
  name: z.string().min(1, { message: "cannot be empty" }),
  role: z.nativeEnum(Role),
}) satisfies z.Schema<Omit<Prisma.PlayerUncheckedCreateInput, "staticId">>;
