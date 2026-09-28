"use client";

import { useOptimistic, useTransition } from "react";

import Link from "next/link";

import { toggleAssignment } from "@/app/actions/student";
import {
  Bar,
  CheckMark,
  Chevron,
  Kicker,
  Panel,
  TextLink,
} from "@/components/student/kit";
import type { WorkItem } from "@/lib/student-work";
import { cn } from "@/lib/utils";

/**
 * Liste de devoirs cochables (CDC 3.1) : la case bascule tout de suite,
 * l'intitulé ouvre le détail du devoir.
 *
 * - `home`     : carte de l'accueil, « À faire · 1 / 2 » + « Tout voir » ;
 * - `progress` : bandeau de progression + liste (page Mon travail) ;
 * - `list`     : liste seule (« Pour plus tard », « Terminés »).
 */
export function WorkChecklist({
  items,
  mode,
  title,
  moreHref,
}: {
  items: WorkItem[];
  mode: "home" | "progress" | "list";
  title?: string;
  moreHref?: string;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    items,
    (state, { id, done }: { id: string; done: boolean }) =>
      state.map((item) => (item.id === id ? { ...item, done } : item)),
  );

  const doneCount = optimistic.filter((item) => item.done).length;
  const count = `${doneCount} / ${optimistic.length}`;

  const toggle = (item: WorkItem) => {
    const done = !item.done;
    startTransition(async () => {
      setOptimistic({ id: item.id, done });
      await toggleAssignment(item.id, done);
    });
  };

  const rows = (
    <ul className={cn("flex flex-col", mode === "home" ? "gap-3.5" : "gap-[13px] lg:gap-[15px]")}>
      {optimistic.map((item) => (
        <li key={item.id} className="flex items-start gap-[11px] lg:gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={item.done}
            aria-label={`Marquer « ${item.title} » comme ${item.done ? "à faire" : "fait"}`}
            onClick={() => toggle(item)}
            className="flex-none rounded-[7px]"
          >
            <CheckMark on={item.done} />
          </button>
          <Link
            href={`/app/devoirs/${item.id}`}
            className="group flex min-w-0 flex-1 items-start gap-3 no-underline"
          >
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-[14.5px] font-semibold leading-[1.3] group-hover:text-brand-800 lg:text-[15px] lg:leading-[1.35]",
                  mode === "home" && "text-sm lg:text-[14.5px]",
                  item.done ? "text-muted line-through" : "text-brand-600",
                )}
              >
                {item.title}
              </span>
              <span className="block text-xs leading-[1.35] text-muted-soft lg:text-[12.5px]">
                {item.meta}
              </span>
            </span>
            {mode === "home" ? null : <Chevron />}
          </Link>
        </li>
      ))}
    </ul>
  );

  if (mode === "home") {
    return (
      <Panel size="lg" className="flex flex-col gap-3 lg:gap-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <Kicker>
            {title ?? "À faire"} · {count}
          </Kicker>
          {moreHref ? <TextLink href={moreHref}>Tout voir</TextLink> : null}
        </div>
        {rows}
      </Panel>
    );
  }

  if (mode === "progress") {
    return (
      <>
        <Panel tone="soft" className="flex flex-col gap-[9px] lg:gap-2.5 lg:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <Kicker tone="brand">{title ?? "À faire"}</Kicker>
            <span className="font-display text-[13px] font-bold tabular-nums text-brand-800 lg:text-sm">
              {count}
            </span>
          </div>
          <Bar
            tone="soft"
            value={optimistic.length ? (doneCount / optimistic.length) * 100 : 0}
            label="Devoirs faits"
          />
        </Panel>
        <Panel>{rows}</Panel>
      </>
    );
  }

  return (
    <Panel className={cn(title && "flex flex-col gap-2.5 lg:gap-[11px]")}>
      {title ? <Kicker>{title}</Kicker> : null}
      {rows}
    </Panel>
  );
}
