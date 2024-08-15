"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prismaClient";

export async function createStaticAndRedirect() {
  const newStatic = await prisma.playerStatic.create({
    data: { name: "" },
  });
  redirect(`/statics/${newStatic.slug}`);
}
