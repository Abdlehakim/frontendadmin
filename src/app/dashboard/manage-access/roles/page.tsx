// app/dashboard/manage-access/roles/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import PaginationAdmin from "@/components/PaginationAdmin";
import Link from "next/link";
import Popup from "@/components/Popup/DeletePopup";
import UpdatePopup from "@/components/Popup/UpdatePopup";
import { FaSpinner } from "react-icons/fa6";

interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

export default function RolesClientPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("");

  // Delete popup state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string>("");
  const [deleteUserName, setDeleteUserName] = useState<string>("");

  // Update-permission popup state
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateRoleId, setUpdateRoleId] = useState<string>("");
  const [updatePerm, setUpdatePerm] = useState<string>("");

  const pageSize = 12;

  // Filters + paging
  const filteredRoles = useMemo(() => {
    return roles
      .filter((r) => (!filterRole || r.name === filterRole))
      .filter((r) =>
        !searchTerm ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [roles, filterRole, searchTerm]);

  const totalPages = useMemo(
    () => Math.ceil(filteredRoles.length / pageSize),
    [filteredRoles.length]
  );

  const displayedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, currentPage]);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          fetchFromAPI<{ roles: Role[] }>("/dashboardadmin/roles"),
          fetchFromAPI<{ permissions: string[] }>(
            "/dashboardadmin/getAllPermission"
          ),
        ]);
        setRoles(rolesRes.roles);
        setPermissions(permsRes.permissions);
      } catch (error) {
        console.error("Error loading roles or permissions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Delete handlers
  const openDelete = (id: string, name: string) => {
    setDeleteUserId(id);
    setDeleteUserName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);
  const confirmDelete = (id: string) => {
    handleDelete(id);
    closeDelete();
  };
  const handleDelete = async (roleId: string) => {
    try {
      await fetchFromAPI(`/dashboardadmin/roles/delete/${roleId}`, {
        method: "DELETE",
      });
      setRoles((prev) => prev.filter((r) => r._id !== roleId));
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("Deletion failed.");
    }
  };

  // Toggle-permission handler
  const handleToggle = async (roleId: string, perm: string) => {
    const role = roles.find((r) => r._id === roleId)!;
    const newPermissions = role.permissions.includes(perm)
      ? role.permissions.filter((p) => p !== perm)
      : [...role.permissions, perm];

    // optimistic UI update
    setRoles((prev) =>
      prev.map((r) =>
        r._id === roleId ? { ...r, permissions: newPermissions } : r
      )
    );

    try {
      await fetchFromAPI(
        `/dashboardadmin/roles/updatePermission/${roleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: newPermissions }),
        }
      );
    } catch (err) {
      console.error("Error updating permissions:", err);
      alert("Failed to save permissions. Reverting.");
      // revert on error
      setRoles((prev) =>
        prev.map((r) =>
          r._id === roleId ? { ...r, permissions: role.permissions } : r
        )
      );
    }
  };

  // Update-permission popup
  const openUpdate = (roleId: string, perm: string) => {
    setUpdateRoleId(roleId);
    setUpdatePerm(perm);
    setIsUpdateOpen(true);
  };
  const closeUpdate = () => setIsUpdateOpen(false);
  const confirmUpdate = () => {
    handleToggle(updateRoleId, updatePerm);
    closeUpdate();
  };

  // For popup display text
  const currentlyHas = roles
    .find((r) => r._id === updateRoleId)
    ?.permissions.includes(updatePerm);
  const currentValue = currentlyHas ? "Enabled" : "Disabled";
  const newValue = currentlyHas ? "Disabled" : "Enabled";

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4  h-full">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Roles & Permissions</h1>
        <Link href="/dashboard/manage-access/roles/create">
          <button className="w-[155px] h-[40px] bg-tertiary rounded text-white transition hover:opacity-90">
            Create New Role
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label htmlFor="searchUser" className="font-medium">
            Search by Name:
          </label>
          <input
            id="searchUser"
            type="text"
            placeholder="Enter username"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="roleFilter" className="font-medium">
            Filter by Role:
          </label>
          <select
            id="roleFilter"
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role._id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* header always visible */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr>
              <th className="px-4 py-2 text-sm font-medium text-center border-x-4">
                Role Name
              </th>
              {permissions.map((perm) => (
                <th
                  key={perm}
                  className="px-4 py-2 text-sm font-medium text-center border-x-4"
                >
                  {perm}
                </th>
              ))}
              <th className="px-4 py-2 text-sm font-medium text-center">
                Action
              </th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedRoles.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    No users found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedRoles.map((role) => (
                  <tr
                    key={role._id}
                    className="even:bg-gray-100 odd:bg-white"
                  >
                    <td className="px-4 py-2 text-sm text-center font-semibold">
                      {role.name}
                    </td>
                    {permissions.map((perm) => (
                      <td key={perm} className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={role.permissions.includes(perm)}
                          onChange={() => openUpdate(role._id, perm)}
                          className="h-4 w-4"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 flex justify-center">

                      <div className="flex justify-center items-center gap-2">
                        <Link href={`/dashboard/manage-access/roles/update/${role._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() =>
                            openDelete(role._id, role.name)
                          }
                          className="bg-primary text-white w-8 h-8 flex justify-center items-center rounded transition hover:opacity-90"
                          aria-label="Delete role"
                        >
                          <FaTrashAlt size={16} />
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

      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>


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
          id={updateRoleId}
          userName={updatePerm}
          fieldName="Permission"
          currentValue={currentValue}
          newValue={newValue}
          handleClosePopup={closeUpdate}
          onConfirm={() => confirmUpdate()}
        />
      )}
    </div>
  );
}
