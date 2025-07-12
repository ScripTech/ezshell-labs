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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) {
          throw new Error(`Failed to fetch users: ${res.status}`);
        }
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again later.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Collect unique roles for filter dropdown
  const allRoles = Array.from(new Set(users.map(user => user.role)));

  // Filter and search
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="px-3">
      <h1 className="text-xl font-bold mb-4">Users</h1>
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
        <Link href="/admin/users/invite">
          <Button>Invite User</Button>
        </Link>
        <Input
          placeholder="Search users..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={roleFilter}
          onValueChange={value => {
            setRoleFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Roles</SelectItem>
              {allRoles.map(role => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded shadow">
        {error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : (
          <DataTable columns={columns} data={paginatedUsers} isLoading={loading} />
        )}
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
              <SelectValue placeholder="Rows per page" />
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
