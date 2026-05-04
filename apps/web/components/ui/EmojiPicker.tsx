"use client";
import * as React from "react";
import { REACTION_EMOJIS, type ReactionEmoji } from "@dorandoran/shared";
import { cn } from "@/lib/cn";

type Props = {
  selected?: ReactionEmoji[];
  onToggle?: (emoji: ReactionEmoji) => void;
  className?: string;
};

export function EmojiPicker({ selected = [], onToggle, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {REACTION_EMOJIS.map((emoji) => {
        const active = selected.includes(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle?.(emoji)}
            aria-pressed={active}
            className={cn(
              "h-12 w-12 rounded-duo border-2 text-2xl transition-transform",
              "active:translate-y-px",
              active
                ? "border-duo-blue bg-duo-blue/10 shadow-duo-card scale-105"
                : "border-duo-border bg-duo-bg hover:bg-duo-bg-muted",
            )}
          >
            <span aria-hidden>{emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
