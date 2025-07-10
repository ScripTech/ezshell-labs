import Link from "next/link";

// Define columns for shadcn DataTable
export const columns = [
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
      <Link href={`/admin/labs/${ row.original.id }/edit`} className="text-blue-600">
        Edit
      </Link>
    ),
  },
];



// Minimal shadcn/ui DataTable implementation for this page
export function DataTable({ columns, data, isLoading }: { columns: any[]; data: any[]; isLoading?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.accessorKey || col.id} className="px-4 py-2 text-left border-b font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-muted-foreground">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-muted-foreground">
                No labs found.
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className="border-b last:border-b-0">
                {columns.map((col) => (
                  <td key={col.accessorKey || col.id} className="px-4 py-2">
                    {col.cell ? col.cell({ row: { original: row } }) : row[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
