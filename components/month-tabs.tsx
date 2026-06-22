"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Month {
  year: number;
  month: number;
  label: string;
}

interface MonthTabsProps {
  months: Month[];
  activeMonth: string;
  onMonthChange: (value: string) => void;
}

export function MonthTabs({ months, activeMonth, onMonthChange }: MonthTabsProps) {
  if (months.length === 0) return null;

  return (
    <Tabs value={activeMonth} onValueChange={onMonthChange}>
      <TabsList className="w-full justify-start overflow-x-auto">
        {months.map((m) => (
          <TabsTrigger key={m.label} value={m.label} className="min-w-fit">
            {m.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
