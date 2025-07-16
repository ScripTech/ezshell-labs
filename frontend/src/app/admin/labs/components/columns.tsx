"use client"

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table"

// Define columns for shadcn DataTable
export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "labId",
    header: "Lab ID",
    cell: ({ row }: any) => <span>{row.original.labId}</span>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }: any) => <span>{row.original.name}</span>,
  },
  {
    accessorKey: "technologies",
    header: "Technologies",
    cell: ({ row }: any) => (
      <span>
        {row.original.technologies?.join(", ") || "-"}
      </span>
    ),
  },
  {
    accessorKey: "duration",
    header: "Duration (min)",
    cell: ({ row }: any) => <span>{row.original.duration}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => (
      <div className="flex space-x-3">
        <Link href={`/admin/labs/${ row.original.id }/edit`} className="text-blue-600 hover:underline cursor-pointer">
          Edit
        </Link>
        <Link href={`/admin/labs/${ row.original.id }/edit`} className="text-red-600 hover:underline cursor-pointer">
          Delete
        </Link>
      </div>
    ),
  },
];
