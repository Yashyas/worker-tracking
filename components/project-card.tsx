"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";

interface ProjectCardProps {
  id: string;
  name: string;
  location: string | null;
  status: ProjectStatus;
  workerCount: number;
  onStatusChange: (status: ProjectStatus) => void;
}

const statusStyles: Record<ProjectStatus, string> = {
  ACTIVE: "bg-blue-500 hover:bg-blue-600",
  COMPLETED: "bg-gray-500 hover:bg-gray-600",
  ARCHIVED: "bg-transparent border border-gray-300 text-gray-500 hover:bg-gray-100",
};

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function ProjectCard({ id, name, location, status, workerCount, onStatusChange }: ProjectCardProps) {
  return (
    <Card className="relative hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/projects/${id}`} className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{name}</h3>
            {location && <p className="text-sm text-muted-foreground truncate mt-0.5">{location}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>
              <span className="text-sm text-muted-foreground">{workerCount} worker{workerCount !== 1 ? "s" : ""}</span>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>} />
            <DropdownMenuContent align="end">
              {status !== "COMPLETED" && (
                <DropdownMenuItem onClick={() => onStatusChange("COMPLETED")}>
                  Mark Completed
                </DropdownMenuItem>
              )}
              {status !== "ARCHIVED" && (
                <DropdownMenuItem onClick={() => onStatusChange("ARCHIVED")}>
                  Archive
                </DropdownMenuItem>
              )}
              {status !== "ACTIVE" && (
                <DropdownMenuItem onClick={() => onStatusChange("ACTIVE")}>
                  Reactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
