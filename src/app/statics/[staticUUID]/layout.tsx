import { ReactNode } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BroadcastListener } from "@/lib/broadcastListener";
export default function Layout({
  modal,
  children,
  params: { staticUUID },
}: {
  modal: ReactNode;
  children: ReactNode;
  params: { staticUUID: string };
}) {
  return (
    <BroadcastListener staticUUID={staticUUID}>
      <main className="flex flex-col items-center justify-between px-8 py-8">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <Link className="ml-auto" href={`/statics/${staticUUID}/inactive`}>
            Inactive players
          </Link>
        </div>
        <Table className="flex max-w-full justify-center 2xl:table">
          <TableHeader className="hidden 2xl:table-header-group">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead colSpan={2}>Weapon</TableHead>
              <TableHead colSpan={2}>Head</TableHead>
              <TableHead colSpan={2}>Chest</TableHead>
              <TableHead colSpan={2}>Hands</TableHead>
              <TableHead colSpan={2}>Legs</TableHead>
              <TableHead colSpan={2}>Feet</TableHead>
              <TableHead colSpan={2}>Earring</TableHead>
              <TableHead colSpan={2}>Necklace</TableHead>
              <TableHead colSpan={2}>Bracelet</TableHead>
              <TableHead colSpan={2}>Ring</TableHead>
              <TableHead colSpan={2}>Ring</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody className="flex w-full flex-col 2xl:table-row-group">
            {children}
          </TableBody>
        </Table>
        {modal}
      </main>
    </BroadcastListener>
  );
}
