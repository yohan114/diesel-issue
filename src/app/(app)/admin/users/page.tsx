import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { PageHeader } from "@/components/layout/page-header";
import { CollapsibleCard } from "@/components/layout/collapsible-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, Th, Tr, Td, TableScroll } from "@/components/ui/table";
import { CreateUserForm } from "@/components/forms/create-user-form";
import { UserRowActions } from "@/components/forms/user-row-actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await getSessionUser();
  const users = await db.user.findMany({ orderBy: [{ role: "asc" }, { username: "asc" }] });

  return (
    <div className="space-y-5">
      <PageHeader title="Users" subtitle="Create accounts and manage access. Users are add-only; admins have full control." />

      <CollapsibleCard title="Create user">
        <CreateUserForm />
      </CollapsibleCard>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <span className="text-xs text-slate-500">{users.length} total</span>
        </CardHeader>
        <CardContent className="p-0">
          <TableScroll>
            <Table className="min-w-[680px]">
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Username</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {users.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-medium text-slate-900">{u.name}{u.id === me?.id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</Td>
                    <Td className="text-slate-500">{u.username}</Td>
                    <Td><Badge tone={u.role === "ADMIN" ? "blue" : "slate"}>{u.role === "ADMIN" ? "Admin" : "User"}</Badge></Td>
                    <Td><Badge tone={u.active ? "green" : "red"}>{u.active ? "Active" : "Inactive"}</Badge></Td>
                    <Td className="text-slate-500">{formatDate(u.createdAt)}</Td>
                    <Td>
                      <div className="flex justify-end">
                        <UserRowActions userId={u.id} active={u.active} isSelf={u.id === me?.id} />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        </CardContent>
      </Card>
    </div>
  );
}
