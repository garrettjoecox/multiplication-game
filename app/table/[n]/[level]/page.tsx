import { notFound } from "next/navigation";
import { GameScreen } from "@/components/GameScreen";
import { LEVELS, TABLES } from "@/lib/game";

export function generateStaticParams() {
  return TABLES.flatMap((table) =>
    LEVELS.map((level) => ({ n: String(table), level: String(level.id) })),
  );
}

export default async function Page({
  params,
}: PageProps<"/table/[n]/[level]">) {
  const { n, level } = await params;
  const table = Number(n);
  const found = LEVELS.find((l) => String(l.id) === level);
  if (!TABLES.includes(table) || !found) notFound();
  return <GameScreen table={table} levelId={found.id} />;
}
