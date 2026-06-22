"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onDateChange(subDays(date, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="min-w-[200px] justify-start gap-2"><CalendarIcon className="h-4 w-4" />{format(date, "EEE, d MMM yyyy")}</Button>} />
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                onDateChange(d);
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={() => onDateChange(addDays(date, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
