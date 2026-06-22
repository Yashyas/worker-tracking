"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface AttendanceToggleProps {
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function AttendanceToggle({ value, onValueChange, disabled }: AttendanceToggleProps) {
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(v) => {
        if (v.length > 0) onValueChange(v[v.length - 1]);
      }}
      disabled={disabled}
      size="sm"
    >
      <ToggleGroupItem
        value="PRESENT"
        className="aria-pressed:bg-green-500 aria-pressed:text-white min-w-20"
      >
        Present
      </ToggleGroupItem>
      <ToggleGroupItem
        value="ABSENT"
        className="aria-pressed:bg-rose-500 aria-pressed:text-white min-w-20"
      >
        Absent
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
