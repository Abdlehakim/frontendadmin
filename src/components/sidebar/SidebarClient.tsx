// src/components/SidebarClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { useAuth, User } from "@/hooks/useAuthDashboard";
import { MdOutlineDashboard } from "react-icons/md";
import { FaUsersViewfinder, FaRegMoneyBill1 } from "react-icons/fa6";
import {
  LuCircleParking,
  LuArrowBigLeft,
  LuArrowBigRight,
} from "react-icons/lu";
import { PiArticleMediumBold, PiUsersThree } from "react-icons/pi";
import { CgWebsite } from "react-icons/cg";
import { BiChevronRight } from "react-icons/bi";
import { VscSignOut } from "react-icons/vsc";
import IconButton from "@/components/sidebar/IconButton";
import { TbTruckDelivery } from "react-icons/tb";

interface Props {
  initialUser: User | null;
}

interface SidebarItem {
  name: string;
  href?: string;
  icon?: React.ReactElement;
  permission?: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <MdOutlineDashboard size={20} />,
  },
  {
    name: "Manage Access",
    icon: <FaUsersViewfinder size={20} />,
    permission: "M_Access",
    children: [
      {
        name: "Users",
        href: "/dashboard/manage-access/users",
        icon: <FaUsersViewfinder size={20} />,
      },
      {
        name: "Roles",
        href: "/dashboard/manage-access/roles",
        icon: <FaUsersViewfinder size={20} />,
      },
    ],
  },
  {
    name: "Manage Website",
    icon: <CgWebsite size={20} />,
    children: [
      {
        name: "Home page data",
        href: "/dashboard/manage-website/home-page",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Product page data",
        href: "/dashboard/manage-website/product-page",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Company",
        href: "/dashboard/manage-website/company-data",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Banners",
        href: "/dashboard/manage-website/banners",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Manage Stock",
    icon: <LuCircleParking size={20} />,
    children: [
      {
        name: "Boutiques",
        href: "/dashboard/manage-stock/boutiques",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Brands",
        href: "/dashboard/manage-stock/brands",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Categories",
        href: "/dashboard/manage-stock/categories",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Sous Categories",
        href: "/dashboard/manage-stock/sub-categories",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Product Attributes",
        href: "/dashboard/manage-stock/product-attributes",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "All Products",
        href: "/dashboard/manage-stock/products",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Manage Client",
    icon: <PiUsersThree size={20} />,
    children: [
      {
        name: "Clients siteweb",
        href: "/dashboard/manage-client/clients",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Clients boutique",
        href: "/dashboard/manage-client/clients-shop",
        icon: <LuCircleParking size={20} />,
      },
        {
        name: "Clients Societe",
        href: "/dashboard/manage-client/client-company",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Orders",
        href: "/dashboard/manage-client/orders",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Payment Options",
    icon: <FaRegMoneyBill1 size={20} />,
    children: [
      {
        name: "Payment Methods",
        href: "/dashboard/payment-options/payment-methods/",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Currency",
        href: "/dashboard/payment-options/currency",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Delivery options",
    href: "/dashboard/delivery-options",
    icon: <TbTruckDelivery size={20} />,
  },
  {
    name: "Blog",
    icon: <PiArticleMediumBold size={20} />,
    children: [
      {
        name: "Categories",
        href: "/dashboard/blog/postcategorie",
        icon: <PiArticleMediumBold size={20} />,
      },
      {
        name: "Sous Categories",
        href: "/dashboard/blog/postsubcategorie",
        icon: <PiArticleMediumBold size={20} />,
      },
      {
        name: "Articles",
        href: "/dashboard/blog/articles",
        icon: <PiArticleMediumBold size={20} />,
      },
    ],
  },
];

export default function SidebarClient({ initialUser }: Props) {
  const { user, loading } = useAuth(initialUser);
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // auto-expand sections on load when in expanded mode
  useEffect(() => {
    sidebarItems.forEach((item) => {
      if (item.children) {
        const match = item.children.some((c) =>
          pathname?.startsWith(c.href ?? "")
        );
        if (match) setExpanded({ [item.name]: true });
      }
    });
  }, [pathname]);

  if (loading)
    return (
      <aside className="bg-primary text-white flex items-center justify-center h-full">
        Loading…
      </aside>
    );
  if (!user) {
    router.push("/");
    return null;
  }

  const initials = (user.username || user.email).slice(0, 2).toUpperCase();
  const hasPermission = (perm: string) =>
    Boolean(user.role?.permissions?.includes(perm));
  const toggleCollapse = () => setCollapsed((c) => !c);
  const toggleExpand = (name: string) =>
    setExpanded((prev) => {
      const isOpen = !!prev[name];
      return isOpen ? {} : { [name]: true };
    });
  const handleSignOut = async () => {
    try {
      await fetchFromAPI("/dashboardAuth/logout", { method: "POST" });
    } finally {
      router.push("/");
    }
  };

  return (
    <aside
      className={`flex flex-col justify-between bg-primary text-white transition-all duration-300 ease-in-out ${
        collapsed ? "w-[60px]" : "w-[280px]"
      } h-screen`}
    >
      <div className="flex flex-col gap-4 h-screen relative">
        {/* Header */}
        <div className="flex items-center justify-center h-[80px] border-b-2 ">
          <div className="flex items-center gap-2">
            <div className="bg-white px-1 text-2xl text-black rounded-md flex items-center justify-center font-bold">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex flex-col transition-all whitespace-nowrap overflow-hidden duration-300 ease-in-out">
                <span className="capitalize">
                  {user.username ?? user.email}
                </span>
                <span className="text-xs font-light">
                  Role: {user.role?.name ?? "—"}
                </span>
              </div>
            )}
          </div>
          <IconButton
            icon={
              collapsed ? (
                <LuArrowBigRight size={20} />
              ) : (
                <LuArrowBigLeft size={20} />
              )
            }
            onClick={toggleCollapse}
          />
        </div>

        {/* Navigation */}
        <nav
          className={`flex flex-col justify-between max-h-[80%] ${
            collapsed ? "overflow-visible" : "overflow-hidden"
          } gap-2 py-4 flex-grow`}
        >
          <div>
            {sidebarItems
              .filter(
                (item) => !item.permission || hasPermission(item.permission)
              )
              .map((item) => {
                // collapsed sidebar: just icon + pop-out on hover
                if (collapsed) {
                  return (
                    <div key={item.name} className="group relative">
                      {item.children ? (
                        <>
                          <div className="flex h-8 gap-2 justify-center items-center w-full hover:bg-hoverButton transition-all duration-900">
                            {item.icon}
                          </div>

                          <div className="absolute top-0 left-full hidden group-hover:block z-40 text-white">
                            <div className="min-w-[200px] w-max ml-2 bg-primary rounded-md border-2 border-white shadow-lg">
                              {/* Children */}
                              {item.children.map((child) => (
                                <Link
                                  key={child.name}
                                  href={child.href!}
                                  className="block px-4 py-2 whitespace-nowrap hover:bg-hoverButton"
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <Link
                          href={item.href!}
                          className="flex h-8 gap-2 justify-center items-center w-full hover:bg-hoverButton "
                        >
                          <span>{item.icon}</span>
                        </Link>
                      )}
                    </div>
                  );
                }

                // expanded sidebar
                const isOpen = !!expanded[item.name];
                return (
                  <div key={item.name}>
                    {item.children ? (
                      <>
                        <div
                          onClick={() => toggleExpand(item.name)}
                          className="flex items-center px-8 h-8 cursor-pointer hover:bg-white hover:text-hoverText text-xs select-none"
                        >
                          <span className="mr-3">{item.icon}</span>
                          <span className="flex-1 whitespace-nowrap overflow-hidden">
                            {item.name}
                          </span>
                          <span
                            className={`transform transition-transform duration-200 ease-in-out ${
                              isOpen ? "rotate-90" : "rotate-0"
                            }`}
                          >
                            <BiChevronRight size={20} />
                          </span>
                        </div>

                        {/* always in the tree, but animating max-height & opacity */}
                        <ul
                          className={`
      ml-8 flex flex-col gap-2 py-2 text-xs
      overflow-hidden whitespace-nowrap
      transition-[max-height,opacity] duration-600 ease-in-out
      ${isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}
    `}
                        >
                          {item.children.map((child) => (
                            <li key={child.name}>
                              <Link
                                href={child.href!}
                                className="flex items-center px-8 h-6 hover:bg-white hover:text-hoverText"
                              >
                                <span className="ml-5">{child.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <Link
                        href={item.href!}
                        className="flex items-center px-8 h-8 hover:bg-white hover:text-hoverText transition-all  text-xs mb-2"
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </Link>
                    )}
                  </div>
                );
              })}
          </div>
          {/* Sign-out */}
          <div
            className={`
    overflow-hidden flex items-center
    transition-all duration-300 ease-in-out
    ${collapsed ? "justify-center h-8 mt-8" : "justify-end h-16 mt-0"}
  `}
          >
            <button
              onClick={handleSignOut}
              className={`
      flex items-center justify-center
      transition-colors duration-200 ease-in-out
      ${
        collapsed
          ? ""
          : "gap-2 h-10 w-36 border-y-2 border-l-2 rounded-l-md border-gray-200 hover:bg-white hover:text-hoverText"
      }
    `}
            >
              <VscSignOut size={20} />
              {!collapsed && (
                <span className="ml-2 duration-200 transition-all whitespace-nowrap overflow-hidden">
                  SIGN OUT
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
