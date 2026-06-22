"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TimeBlockChipProps {
  fromTime: string;
  toTime: string;
  onDelete: () => void;
}

export function TimeBlockChip({ fromTime, toTime, onDelete }: TimeBlockChipProps) {
  return (
    <Badge variant="secondary" className="gap-1 px-3 py-1 text-sm">
      {fromTime}–{toTime}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="ml-1 hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
