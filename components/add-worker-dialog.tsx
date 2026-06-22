"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createWorker } from "@/lib/actions/worker-actions";

const WORKER_TYPES = ["Mason", "Helper", "Electrician", "Plumber", "Carpenter", "Steel Fixer", "Painter", "Other"];

export function AddWorkerDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerType, setWorkerType] = useState("");

  async function handleSubmit(formData: FormData) {
    formData.append("projectId", projectId);
    if (workerType && workerType !== "Other") {
      formData.set("workerType", workerType);
    }
    setError(null);
    try {
      await createWorker(formData);
      setOpen(false);
      setWorkerType("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Add Worker</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Worker</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Worker Name *</Label>
            <Input id="name" name="name" placeholder="e.g. Rajesh Kumar" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workerType">Worker Type</Label>
            <Select value={workerType} onValueChange={(v) => { if (v !== null) setWorkerType(v); }} name="workerType">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {WORKER_TYPES.map((type) => (
                  <SelectItem key={type} value={type === "Other" ? "" : type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {workerType === "Other" && (
              <Input name="workerType" placeholder="Enter worker type" className="mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyWage">Hourly Wage (₹) *</Label>
            <Input
              id="hourlyWage"
              name="hourlyWage"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 150"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Worker</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
