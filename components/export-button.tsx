"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

interface ExportButtonProps {
  onExportThisMonth?: () => void;
  onExportAll?: () => void;
  label?: string;
  showDropdown?: boolean;
}

export function ExportButton({ onExportThisMonth, onExportAll, label = "Export CSV", showDropdown = true }: ExportButtonProps) {
  if (!showDropdown || !onExportAll) {
    return (
      <Button variant="outline" size="sm" onClick={onExportThisMonth}>
        <Download className="h-4 w-4 mr-2" />
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />{label}</Button>} />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportThisMonth}>This Month</DropdownMenuItem>
        {onExportAll && <DropdownMenuItem onClick={onExportAll}>All Time</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
