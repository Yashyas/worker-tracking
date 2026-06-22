"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface TimeBlockPickerProps {
  onAdd: (fromTime: string, toTime: string) => void;
}

export function TimeBlockPicker({ onAdd }: TimeBlockPickerProps) {
  const [open, setOpen] = useState(false);
  const [fromTime, setFromTime] = useState("08:00");
  const [toTime, setToTime] = useState("17:00");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fromTime && toTime) {
      onAdd(fromTime, toTime);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="border-dashed"><Plus className="h-3 w-3 mr-1" />Add time block</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Time Block</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromTime">From</Label>
              <Input
                id="fromTime"
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toTime">To</Label>
              <Input
                id="toTime"
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
