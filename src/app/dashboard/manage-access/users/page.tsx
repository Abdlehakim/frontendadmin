// dashboard/manage-access/users/page.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";
import UpdatePopup from "@/components/Popup/UpdatePopup";

interface Role { _id: string; name: string; }
interface User { _id: string; username: string; email: string; role: Role; }

export default function UsersClientPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filterRole, setFilterRole] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Delete popup
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string>("");
  const [deleteUserName, setDeleteUserName] = useState<string>("");

  // Update popup
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateUserId, setUpdateUserId] = useState<string>("");
  const [updateRoleId, setUpdateRoleId] = useState<string>("");
  const [updateUserName, setUpdateUserName] = useState<string>("");

  const pageSize = 12;

  // filters + pagination
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => !filterRole || u.role._id === filterRole)
      .filter(u => !searchTerm ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [users, filterRole, searchTerm]);

  const totalPages = useMemo(
    () => Math.ceil(filteredUsers.length / pageSize),
    [filteredUsers.length]
  );

  const displayedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  // fetch
  useEffect(() => {
    async function fetchData() {
      try {
        const [{ users }, { roles }] = await Promise.all([
          fetchFromAPI<{ users: User[] }>("/dashboardadmin/getAllUsersWithRole"),
          fetchFromAPI<{ roles: Role[] }>("/dashboardadmin/roles"),
        ]);
        setUsers(users);
        setRoles(roles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const deleteUser = async (id: string) => {
    try {
      await fetchFromAPI(`/dashboardadmin/users/${id}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch {
      alert("Deletion failed.");
    }
  };
  const updateUserRole = async (userId: string, roleId: string) => {
    try {
      await fetchFromAPI(`/dashboardadmin/roles/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      setUsers(prev =>
        prev.map(u =>
          u._id === userId
            ? { ...u, role: roles.find(r => r._id === roleId)! }
            : u
        )
      );
    } catch {
      alert("Role update failed.");
    }
  };

  // open/close helpers
  const openDelete = (id: string, name: string) => {
    setDeleteUserId(id);
    setDeleteUserName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);
  const confirmDelete = () => {
    deleteUser(deleteUserId);
    closeDelete();
  };

  const openUpdate = (id: string, roleId: string, userName: string) => {
    setUpdateUserId(id);
    setUpdateRoleId(roleId);
    setUpdateUserName(userName);
    setIsUpdateOpen(true);
  };
  const closeUpdate = () => setIsUpdateOpen(false);
  const confirmUpdate = () => {
    updateUserRole(updateUserId, updateRoleId);
    closeUpdate();
  };

  const currentRoleName =
    users.find(u => u._id === updateUserId)?.role.name || "";
  const newRoleName =
    roles.find(r => r._id === updateRoleId)?.name || "";

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4  h-full">
      {/* header & create */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">All Users</h1>
        <Link href="/dashboard/manage-access/users/create">
          <button className="w-[250px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New User
          </button>
        </Link>
      </div>

      {/* filters */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label htmlFor="searchUser" className="font-medium">
            Search by Name:
          </label>
          <input
            id="searchUser"
            className="border border-gray-300 rounded px-2 py-1"
            type="text"
            placeholder="Enter username"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="roleFilter" className="font-medium">
            Filter by Role:
          </label>
          <select
            id="roleFilter"
            className="border border-gray-300 rounded px-2 py-1"
            value={filterRole}
            onChange={e => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* header always visible */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 w-1/3 text-center">User Name</th>
              <th className="px-4 py-2 text-center border-x-4">Role</th>
              <th className="px-4 py-2 w-1/3 text-center">Action</th>
            </tr>
          </thead>
        </table>

        {/* scrollable body */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedUsers.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    No users found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedUsers.map(u => (
                  <tr key={u._id} className="even:bg-gray-100 odd:bg-white">
                    <td className="px-4 text-center font-semibold text-gray-800">
                      {u.username}
                    </td>
                    <td className="px-4 text-center">
                      <select
                        value={u.role._id}
                        onChange={e =>
                          openUpdate(u._id, e.target.value, u.username)
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="">No Role</option>
                        {roles.map(r => (
                          <option key={r._id} value={r._id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 text-center">

                      <div className="flex justify-center items-center gap-2">
                        <Link href={`/dashboard/manage-access/users/update/${u._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(u._id, u.username)}
                          className="ButtonSquare"
                          aria-label="Delete user"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* overlay covers only the body region */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* pagination */}
      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* popups */}
      {isDeleteOpen && (
        <Popup
          id={deleteUserId}
          name={deleteUserName}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
      {isUpdateOpen && (
        <UpdatePopup
          id={updateUserId}
          userName={updateUserName}
          fieldName="Role"
          currentValue={currentRoleName}
          newValue={newRoleName}
          handleClosePopup={closeUpdate}
          onConfirm={confirmUpdate}
        />
      )}
    </div>
  );
}
