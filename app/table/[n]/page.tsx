import { notFound } from "next/navigation";
import { TableScreen } from "@/components/TableScreen";
import { TABLES } from "@/lib/game";

export function generateStaticParams() {
  return TABLES.map((table) => ({ n: String(table) }));
}

export default async function Page({ params }: PageProps<"/table/[n]">) {
  const { n } = await params;
  const table = Number(n);
  if (!TABLES.includes(table)) notFound();
  return <TableScreen table={table} />;
}
