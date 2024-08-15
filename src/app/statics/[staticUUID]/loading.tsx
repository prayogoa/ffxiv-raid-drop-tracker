import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <TableRow>
      <TableCell colSpan={25}>
        <Skeleton className="w-full" />
      </TableCell>
    </TableRow>
  );
}
