"use client";
import { useOptimistic } from "react";

import { createStaticAndRedirect } from "./actions";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isCreating, setIsCreating] = useOptimistic(false);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Button onClick={() => createStaticAndRedirect()}>New static</Button>
    </main>
  );
}
