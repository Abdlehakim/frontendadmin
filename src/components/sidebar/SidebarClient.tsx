"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  isHeader?: boolean;
}

/* ---------------- helpers (module-scoped) ---------------- */
const normalizePath = (s?: string) => {
  if (!s) return "";
  const noTrail = s.replace(/\/+$/, "");
  return noTrail.length ? noTrail : "/";
};

const collectHrefs = (items?: SidebarItem[]): string[] => {
  const out: string[] = [];
  items?.forEach((it) => {
    if (it.href) out.push(it.href);
    if (it.children) out.push(...collectHrefs(it.children));
  });
  return out;
};

const sidebarItems: SidebarItem[] = [
  {
    name: "Tableau de bord",
    href: "/dashboard",
    icon: <MdOutlineDashboard size={20} />,
  },
  {
    name: "Gestion des accès",
    icon: <FaUsersViewfinder size={20} />,
    permission: "M_Access",
    children: [
      {
        name: "Utilisateurs",
        href: "/dashboard/manage-access/users",
        icon: <FaUsersViewfinder size={20} />,
      },
      {
        name: "Rôles",
        href: "/dashboard/manage-access/roles",
        icon: <FaUsersViewfinder size={20} />,
      },
    ],
  },
  {
    name: "Gestion du site",
    icon: <CgWebsite size={20} />,
    children: [
      {
        name: "Données page d'accueil",
        href: "/dashboard/manage-website/home-page",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Données page produit",
        href: "/dashboard/manage-website/product-page",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Entreprise",
        href: "/dashboard/manage-website/company-data",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Bannières",
        href: "/dashboard/manage-website/banners",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Gestion du stock",
    icon: <LuCircleParking size={20} />,
    children: [
      {
        name: "Magasins",
        href: "/dashboard/manage-stock/magasins",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Marques",
        href: "/dashboard/manage-stock/brands",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Catégories",
        href: "/dashboard/manage-stock/categories",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Sous-catégories",
        href: "/dashboard/manage-stock/sub-categories",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Attributs produits",
        href: "/dashboard/manage-stock/product-attributes",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Tous les produits",
        href: "/dashboard/manage-stock/products",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Gestion des clients",
    icon: <PiUsersThree size={20} />,
    children: [
      {
        name: "Clients",
        isHeader: true,
        children: [
          {
            name: "Site web",
            href: "/dashboard/manage-client/clients",
            icon: <LuCircleParking size={20} />,
          },
          {
            name: "Passage",
            href: "/dashboard/manage-client/clients-shop",
            icon: <LuCircleParking size={20} />,
          },
          {
            name: "Société",
            href: "/dashboard/manage-client/client-company",
            icon: <LuCircleParking size={20} />,
          },
        ],
      },
      {
        name: "Commandes",
        href: "/dashboard/manage-client/orders",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Options de paiement",
    icon: <FaRegMoneyBill1 size={20} />,
    children: [
      {
        name: "Méthodes de paiement",
        href: "/dashboard/payment-options/payment-methods",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Devise",
        href: "/dashboard/payment-options/currency",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Options de livraison",
    href: "/dashboard/delivery-options",
    icon: <TbTruckDelivery size={20} />,
  },
  {
    name: "Blog",
    icon: <PiArticleMediumBold size={20} />,
    children: [
      {
        name: "Catégories",
        href: "/dashboard/blog/postcategorie",
        icon: <PiArticleMediumBold size={20} />,
      },
      {
        name: "Sous-catégories",
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
  const [collapsed, setCollapsed] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // MOBILE-ONLY CLOSE: closes the menu if viewport < md
  const closeIfMobile = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setCollapsed(true);
    }
  }, []);

  // helper: active matcher (exact, or "startsWith" for non-root)
  const isHrefActive = (href?: string) => {
    if (!href) return false;
    const cur = normalizePath(pathname || "/");
    const target = normalizePath(href);
    if (target === "/dashboard") return cur === target;
    return cur === target || cur.startsWith(target + "/");
  };

  // helper: section is active if itself or any descendant is active
  const isSectionActive = (item: SidebarItem): boolean => {
    if (isHrefActive(item.href)) return true;
    if (item.children?.length) {
      return item.children.some(isSectionActive);
    }
    return false;
  };

  // auto-open section containing current route (expanded mode)
  useEffect(() => {
    const current = normalizePath(pathname || "/");
    const next: Record<string, boolean> = {};
    sidebarItems.forEach((item) => {
      if (!item.children) return;
      const hrefs = collectHrefs(item.children).map(normalizePath);
      const match = hrefs.some(
        (h) => current === h || current.startsWith(h + "/")
      );
      if (match) next[item.name] = true;
    });
    setExpanded(next);
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

  /* -------- collapsed mode row with fly-out + hover bridge -------- */
  const CollapsedRow: React.FC<{ item: SidebarItem }> = ({ item }) => {
    const hasChildren =
      Array.isArray(item.children) && item.children.length > 0;

    const active = isSectionActive(item);

    return (
      <div
        key={item.name}
        className="
          group relative flex flex-col md:gap-2
        "
      >
        {/* icon cell */}
        <div
          className={`flex h-12 gap-2 justify-center items-center w-full transition-all duration-200 ${
            active ? "bg-white text-black" : "hover:bg-white hover:text-black"
          }`}
          title={item.name}
        >
          {item.href && !hasChildren ? (
            <Link
              href={item.href}
              onClick={closeIfMobile}
              aria-current={isHrefActive(item.href) ? "page" : undefined}
              className="flex items-center justify-center w-full h-full"
            >
              {item.icon}
            </Link>
          ) : (
            <div className="w-full h-full flex items-center justify-center cursor-pointer">
              {item.icon}
            </div>
          )}
        </div>

        {/* fly-out panel to the RIGHT with visual gap (ml-2) */}
        {hasChildren && (
          <div
            className="
              hidden group-hover:block
              absolute left-full top-0 ml-2 z-50
              min-w-56 max-w-72
              rounded-md border border-white/10 shadow-xl
              bg-primary text-white
              overflow-hidden
            "
          >
            {/* section title */}
            <div className="px-3 py-2 text-xs font-semibold bg-white/10 md:bg-white/10">
              {item.name}
            </div>

            <div className="py-2">
              {item.children?.map((child) => {
                if (child.isHeader) {
                  return (
                    <div key={child.name} className="mb-1">
                      <div className="px-4 py-1 text-[11px] uppercase tracking-wide text-white/80">
                        {child.name}
                      </div>
                      <ul className="px-1">
                        {child.children?.map((sub) => {
                          const activeSub = isHrefActive(sub.href);
                          return (
                            <li key={sub.name}>
                              <Link
                                href={sub.href!}
                                onClick={closeIfMobile}
                                aria-current={activeSub ? "page" : undefined}
                                className={`flex items-center gap-2 px-4 py-2 text-sm rounded ${
                                  activeSub
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-hoverText"
                                }`}
                              >
                                <span>{sub.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }

                const activeChild = isHrefActive(child.href);
                return (
                  <Link
                    key={child.name}
                    href={child.href!}
                    onClick={closeIfMobile}
                    aria-current={activeChild ? "page" : undefined}
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${
                      activeChild
                        ? "bg-white text-black"
                        : "hover:bg-white hover:text-hoverText"
                    }`}
                  >
                    <span>{child.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {collapsed === false && (
        <div
          onClick={toggleCollapse}
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-primary text-white transition-all duration-300 ease-in-out   
    ${
      collapsed
        ? "-translate-x-full w-[60px]"
        : "translate-x-0 w-[90%] md:w-[280px]"
    }
    md:static md:translate-x-0`}
      >
        <div className="flex flex-col gap-4 h-screen relative">
          <div className="flex items-center justify-center h-[80px] border-b-2 ">
            <div className="flex items-center gap-2">
              <div className="bg-white px-2 rounded-sm text-2xl text-primary flex items-center justify-center font-bold">
                {initials}
              </div>
              {!collapsed && (
                <div className="flex flex-col transition-all whitespace-nowrap duration-500 ease-in-out">
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
              ariaLabel={
                collapsed
                  ? "Ouvrir la barre latérale"
                  : "Fermer la barre latérale"
              }
            />
          </div>

          <nav
            className={`flex flex-col md:select-none overflow-y-auto ${
              collapsed ? "overflow-y-visible" : "overflow-hidden"
            } gap-2 flex-grow`}
          >
            <div className="flex flex-col">
              {sidebarItems
                .filter(
                  (item) => !item.permission || hasPermission(item.permission)
                )
                .map((item) => {
                  const isOpen = !!expanded[item.name];

                  if (collapsed) {
                    // COLLAPSED: icon with hover fly-out
                    return <CollapsedRow key={item.name} item={item} />;
                  }

                  // EXPANDED: accordion
                  return (
                    <div key={item.name}>
                      {item.children ? (
                        <>
                          <div
                            onClick={() => toggleExpand(item.name)}
                            className={`flex items-center px-8 h-12 cursor-pointer text-xs select-none ${
                              isSectionActive(item)
                                ? "bg-white text-black"
                                : "hover:bg-white hover:text-hoverText"
                            }`}
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
                          <ul
                            className={`ml-8 flex flex-col md:gap-2 py-2 text-xs overflow-hidden transition-all duration-500 ease-in-out ${
                              isOpen
                                ? "max-h-60 opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            {item.children.map((child) => {
                              if (child.isHeader) {
                                return (
                                  <div key={child.name}>
                                    <div className="text-xs px-12 h-6 font-semibold text-white select-none">
                                      {child.name}
                                    </div>
                                    <ul className="ml-4 flex flex-col gap-1 text-xs h-fit">
                                      {child.children?.map((subChild) => {
                                        const active = isHrefActive(
                                          subChild.href
                                        );
                                        return (
                                          <li key={subChild.name}>
                                            <Link
                                              href={subChild.href!}
                                              onClick={closeIfMobile}
                                              aria-current={
                                                active ? "page" : undefined
                                              }
                                              className={`flex items-center px-8 h-8 ${
                                                active
                                                  ? "bg-white text-black"
                                                  : "hover:bg-white hover:text-hoverText"
                                              }`}
                                            >
                                              <span className="ml-5">
                                                {subChild.name}
                                              </span>
                                            </Link>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                );
                              }

                              const active = isHrefActive(child.href);
                              return (
                                <li key={child.name}>
                                  <Link
                                    href={child.href!}
                                    onClick={closeIfMobile}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex items-center px-8 h-8 ${
                                      active
                                        ? "bg-white text-black"
                                        : "hover:bg-white hover:text-hoverText"
                                    }`}
                                  >
                                    <span className="ml-5">{child.name}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : (
                        (() => {
                          const active = isHrefActive(item.href);
                          return (
                            <Link
                              href={item.href!}
                              onClick={closeIfMobile}
                              aria-current={active ? "page" : undefined}
                              className={`flex items-center px-8 h-12 transform transition-transform duration-200 ease-in-out text-xs mb-2 ${
                                active
                                  ? "bg-white text-black"
                                  : "hover:bg-white hover:text-hoverText"
                              }`}
                            >
                              <span className="mr-3">{item.icon}</span>
                              <span className="flex-1 whitespace-nowrap overflow-hidden">
                                {item.name}
                              </span>
                            </Link>
                          );
                        })()
                      )}
                    </div>
                  );
                })}
            </div>

            <div
              className={`flex items-center transition-all duration-300 ease-in-out cursor-pointer ${
                collapsed
                  ? "h-12 gap-2 justify-center items-center w-full transition-all duration-200 hover:bg-white hover:text-black my-10"
                  : "justify-center h-16 my-10"
              }`}
            >
              <button
                onClick={handleSignOut}
                className={`flex items-center justify-center transition-colors duration-200 ease-in-out cursor-pointer ${
                  collapsed
                    ? ""
                    : "gap-2 h-10 w-fit p-2 border-y-2 border-2 rounded-md border-gray-200 hover:bg-white hover:text-hoverText"
                }`}
              >
                <VscSignOut size={20} />
                {!collapsed && (
                  <span className="ml-2 duration-200 transition-all whitespace-nowrap text-sm w-fit">
                    SE DÉCONNECTER
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
