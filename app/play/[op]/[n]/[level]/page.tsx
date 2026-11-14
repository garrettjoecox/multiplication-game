import { notFound } from "next/navigation";
import { GameScreen } from "@/components/GameScreen";
import { LEVELS, SUBJECTS, isOp, subject } from "@/lib/game";

export function generateStaticParams() {
  return SUBJECTS.flatMap((s) =>
    s.tables.flatMap((table) =>
      LEVELS.map((level) => ({
        op: s.id,
        n: String(table),
        level: String(level.id),
      })),
    ),
  );
}

export default async function Page({
  params,
}: PageProps<"/play/[op]/[n]/[level]">) {
  const { op, n, level } = await params;
  const table = Number(n);
  const found = LEVELS.find((l) => String(l.id) === level);
  if (!isOp(op) || !subject(op).tables.includes(table) || !found) notFound();
  return <GameScreen op={op} table={table} levelId={found.id} />;
}
