"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table"

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }: any) => <span>{row.original.name}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }: any) => <span>{row.original.email}</span>,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }: any) => <span>{row.original.role}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => (
      <Link href={`/admin/users/${row.original.id}`}>
        <Button variant="outline" size="sm">View</Button>
      </Link>
    ),
  },
];
