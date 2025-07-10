// /app/admin/labs/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { columns, DataTable } from "./components/data-table";

export default function LabsPage() {
	const [labs, setLabs] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [technologyFilter, setTechnologyFilter] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	// Derived filtered and searched labs
	const filteredLabs = labs.filter(lab => {
		const matchesSearch =
			lab.name.toLowerCase().includes(search.toLowerCase()) ||
			(lab.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
		const matchesTech =
			!technologyFilter ||
			(lab.technologies && lab.technologies.includes(technologyFilter));
		return matchesSearch && matchesTech;
	});

	const totalPages = Math.ceil(filteredLabs.length / pageSize);
	const paginatedLabs = filteredLabs.slice((page - 1) * pageSize, page * pageSize);

	useEffect(() => {
		async function fetchLabs() {
			setLoading(true);
			const res = await fetch("/api/labs/available");
			const data = await res.json();
			setLabs(
				Array.isArray(data)
					? data.map((lab) => ({
							...lab,
							technologies: lab.technologies || ["Bash", "Linux"], // fallback
					  }))
					: []
			);
			setLoading(false);
		}
		fetchLabs();
	}, []);

	// Collect unique technologies for filter dropdown
	const allTechnologies = Array.from(
		new Set(labs.flatMap(lab => lab.technologies || []))
	);

	return (
		<div>
			<h1 className="text-xl font-bold mb-4">Lab Management</h1>
			<div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
				<Link href="/admin/labs/create">
					<Button>Create New Lab</Button>
				</Link>
				<Input
					placeholder="Search labs..."
					value={search}
					onChange={e => {
						setSearch(e.target.value);
						setPage(1);
					}}
					className="max-w-xs"
				/>
        <Select
          value={technologyFilter}
          onValueChange={(value: any) => {
            setTechnologyFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a technology" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="?">All Technologies</SelectItem>
              {allTechnologies.map(tech => (
                <SelectItem key={tech} value={tech}>
                  {tech}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
			</div>
			<div className="rounded shadow">
				<DataTable
					columns={columns}
					data={paginatedLabs}
					isLoading={loading}
				/>
			</div>
			{/* Pagination Controls */}
			<div className="flex items-center justify-between mt-4">
				<div>
					Page {page} of {totalPages || 1}
				</div>
				<div className="flex gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={value => {
              setPageSize(Number(value));
              setPage(1);
            }}>
            <SelectTrigger className="border-0 border-b py-1">
              <SelectValue placeholder="Select a technology" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
          <Button
						variant="outline"
						size="sm"
						disabled={page === 1}
						onClick={() => setPage(page - 1)}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={page === totalPages || totalPages === 0}
						onClick={() => setPage(page + 1)}
					>
						Next
					</Button>

				</div>
			</div>
		</div>
	);
}
