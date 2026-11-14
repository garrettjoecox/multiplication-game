import { notFound } from "next/navigation";
import { TableScreen } from "@/components/TableScreen";
import { SUBJECTS, isOp, subject } from "@/lib/game";

export function generateStaticParams() {
  return SUBJECTS.flatMap((s) =>
    s.tables.map((table) => ({ op: s.id, n: String(table) })),
  );
}

export default async function Page({ params }: PageProps<"/play/[op]/[n]">) {
  const { op, n } = await params;
  const table = Number(n);
  if (!isOp(op) || !subject(op).tables.includes(table)) notFound();
  return <TableScreen op={op} table={table} />;
}
