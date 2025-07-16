"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

export const columns: ColumnDef<any>[] = [
	// {
	// 	accessorKey: "labId",
	// 	header: "Lab ID",
	// 	cell: ({ row }: any) => <span className="uppercase">{row.original.labId}</span>,
	// 	enableSorting: true,
	// },
	{
		accessorKey: "title",
		header: "Challenge",
		cell: ({ row }: any) => {
      return (
        <span className="text-blue-600 hover:underline cursor-pointer">
          <Link href={`/ezshell?lab=${ row.original.lab }&question=${ row.original.id }`}>{row.original.title}</Link>
        </span>
      )
    },
	},
	{
		accessorKey: "difficulty",
		header: "Type",
		cell: ({ row }: any) => <span>{row.original.difficulty}</span>,
		enableSorting: true,
	},
	{
		accessorKey: "score",
		header: "Score",
		cell: ({ row }: any) => <span>{row.original.score ?? 0}</span>,
		enableSorting: true,
	},
	{
		accessorKey: "completed",
		header: "Completed",
		cell: ({ row }: any) =>
			row.original.completed ? (
				<span className="text-green-600 font-semibold">Yes</span>
			) : (
				<span className="text-muted-foreground">No</span>
			),
		enableSorting: true,
	},
	{
		accessorKey: "completionTime",
		header: "Completion Time",
		cell: ({ row }: any) => <span>{row.original.completionTime ?? "-"}</span>,
	},
	{
		accessorKey: "topPosition",
		header: "Position",
		cell: ({ row }: any) => (
			<span
				className={
					row.original.topPosition === "Top 1"
						? "font-bold text-green-600"
						: ""
				}
			>
				{row.original.topPosition ?? "-"}
			</span>
		),
		enableSorting: true,
	},
	{
		accessorKey: "labName",
		header: "Lab Name",
		cell: ({ row }: any) => <span>{row.original.labName}</span>,
		enableSorting: true,
	},
]
