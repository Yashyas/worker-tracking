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
import { Pencil } from "lucide-react";
import { updateWorker } from "@/lib/actions/worker-actions";
import { useRouter } from "next/navigation";

const WORKER_TYPES = ["Mason", "Helper", "Electrician", "Plumber", "Carpenter", "Steel Fixer", "Painter", "Other"];

interface EditWorkerDialogProps {
  workerId: string;
  name: string;
  workerType: string;
  hourlyWage: number;
}

export function EditWorkerDialog({ workerId, name, workerType, hourlyWage }: EditWorkerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOtherType = !WORKER_TYPES.includes(workerType);
  const [selectedType, setSelectedType] = useState(isOtherType ? "Other" : workerType);

  async function handleSubmit(formData: FormData) {
    formData.append("workerId", workerId);
    if (selectedType && selectedType !== "Other") {
      formData.set("workerType", selectedType);
    }
    setError(null);
    try {
      await updateWorker(formData);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Worker</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Worker Name *</Label>
            <Input id="name" name="name" defaultValue={name} placeholder="e.g. Rajesh Kumar" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workerType">Worker Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => { if (v !== null) setSelectedType(v); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {WORKER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType === "Other" && (
              <Input
                name="workerType"
                defaultValue={isOtherType ? workerType : ""}
                placeholder="Enter worker type"
                className="mt-2"
              />
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
              defaultValue={Number(hourlyWage).toFixed(2)}
              placeholder="e.g. 150"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
