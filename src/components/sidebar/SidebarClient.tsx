"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { useAuth, User } from "@/hooks/useAuthDashboard";
import { MdOutlineDashboard } from "react-icons/md";
import { FaUsersViewfinder, FaRegMoneyBill1 } from "react-icons/fa6";
import { LuCircleParking, LuArrowBigLeft, LuArrowBigRight } from "react-icons/lu";
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
  { name: "Tableau de bord", href: "/dashboard", icon: <MdOutlineDashboard size={20} /> },
  {
    name: "Gestion des accès",
    icon: <FaUsersViewfinder size={20} />,
    permission: "M_Access",
    children: [
      { name: "Utilisateurs", href: "/dashboard/manage-access/users", icon: <FaUsersViewfinder size={20} /> },
      { name: "Rôles", href: "/dashboard/manage-access/roles", icon: <FaUsersViewfinder size={20} /> },
    ],
  },
  {
    name: "Gestion du site",
    icon: <CgWebsite size={20} />,
    children: [
      { name: "Données page d'accueil", href: "/dashboard/manage-website/home-page", icon: <LuCircleParking size={20} /> },
      { name: "Données page produit", href: "/dashboard/manage-website/product-page", icon: <LuCircleParking size={20} /> },
      { name: "Entreprise", href: "/dashboard/manage-website/company-data", icon: <LuCircleParking size={20} /> },
      { name: "Bannières", href: "/dashboard/manage-website/banners", icon: <LuCircleParking size={20} /> },
    ],
  },
  {
    name: "Gestion du stock",
    icon: <LuCircleParking size={20} />,
    children: [
      { name: "Magasins", href: "/dashboard/manage-stock/magasins", icon: <LuCircleParking size={20} /> },
      { name: "Marques", href: "/dashboard/manage-stock/brands", icon: <LuCircleParking size={20} /> },
      { name: "Catégories", href: "/dashboard/manage-stock/categories", icon: <LuCircleParking size={20} /> },
      { name: "Sous-catégories", href: "/dashboard/manage-stock/sub-categories", icon: <LuCircleParking size={20} /> },
      { name: "Attributs produits", href: "/dashboard/manage-stock/product-attributes", icon: <LuCircleParking size={20} /> },
      { name: "Tous les produits", href: "/dashboard/manage-stock/products", icon: <LuCircleParking size={20} /> },
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
          { name: "Site web", href: "/dashboard/manage-client/clients", icon: <LuCircleParking size={20} /> },
          { name: "Passage", href: "/dashboard/manage-client/clients-shop", icon: <LuCircleParking size={20} /> },
          { name: "Société", href: "/dashboard/manage-client/client-company", icon: <LuCircleParking size={20} /> },
        ],
      },
      { name: "Commandes", href: "/dashboard/manage-client/orders", icon: <LuCircleParking size={20} /> },
    ],
  },
  {
    name: "Options de paiement",
    icon: <FaRegMoneyBill1 size={20} />,
    children: [
      { name: "Méthodes de paiement", href: "/dashboard/payment-options/payment-methods", icon: <LuCircleParking size={20} /> },
      { name: "Devise", href: "/dashboard/payment-options/currency", icon: <LuCircleParking size={20} /> },
    ],
  },
  { name: "Options de livraison", href: "/dashboard/delivery-options", icon: <TbTruckDelivery size={20} /> },
  {
    name: "Blog",
    icon: <PiArticleMediumBold size={20} />,
    children: [
      { name: "Catégories", href: "/dashboard/blog/postcategorie", icon: <PiArticleMediumBold size={20} /> },
      { name: "Sous-catégories", href: "/dashboard/blog/postsubcategorie", icon: <PiArticleMediumBold size={20} /> },
      { name: "Articles", href: "/dashboard/blog/articles", icon: <PiArticleMediumBold size={20} /> },
    ],
  },
];

export default function SidebarClient({ initialUser }: Props) {
  const { user, loading } = useAuth(initialUser);
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // auto-open section containing current route (expanded mode)
  useEffect(() => {
    const current = normalizePath(pathname || "/");
    const next: Record<string, boolean> = {};
    sidebarItems.forEach((item) => {
      if (!item.children) return;
      const hrefs = collectHrefs(item.children).map(normalizePath);
      const match = hrefs.some((h) => current === h || current.startsWith(h + "/"));
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
  const hasPermission = (perm: string) => Boolean(user.role?.permissions?.includes(perm));
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
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;

    return (
      <div
        key={item.name}
        className="
          group relative
          before:absolute before:left-full before:top-0 before:bottom-0 before:w-2
          before:content-['']  /* hover bridge = same as ml-2 */
        "
      >
        {/* icon cell */}
        <div
          className="flex h-8 gap-2 justify-center items-center w-full hover:bg-white hover:text-black transition-all duration-200"
          title={item.name}
        >
          {item.href && !hasChildren ? (
            <Link href={item.href} className="flex items-center justify-center w-full h-full">
              {item.icon}
            </Link>
          ) : (
            <div className="w-full h-full flex items-center justify-center cursor-pointer">{item.icon}</div>
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
            <div className="px-3 py-2 text-xs font-semibold bg-white/10">{item.name}</div>

            <div className="py-2">
              {item.children?.map((child) => {
                if (child.isHeader) {
                  return (
                    <div key={child.name} className="mb-1">
                      <div className="px-4 py-1 text-[11px] uppercase tracking-wide text-white/80">
                        {child.name}
                      </div>
                      <ul className="px-1">
                        {child.children?.map((sub) => (
                          <li key={sub.name}>
                            <Link
                              href={sub.href!}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white hover:text-hoverText rounded"
                            >
                              <span>{sub.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                return (
                  <Link
                    key={child.name}
                    href={child.href!}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white hover:text-hoverText"
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
    <aside
      className={`flex flex-col justify-between bg-primary text-white transition-all duration-300 ease-in-out ${
        collapsed ? "w-[60px]" : "w-[280px]"
      } h-screen`}
    >
      <div className="flex flex-col gap-4 h-screen relative">
        <div className="flex items-center justify-center h-[80px] border-b-2 ">
          <div className="flex items-center gap-2">
            <div className="bg-white px-1 text-2xl text-black rounded-md flex items-center justify-center font-bold">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex flex-col transition-all whitespace-nowrap overflow-hidden duration-300 ease-in-out">
                <span className="capitalize">{user.username ?? user.email}</span>
                <span className="text-xs font-light">Role: {user.role?.name ?? "—"}</span>
              </div>
            )}
          </div>
          <IconButton
            icon={collapsed ? <LuArrowBigRight size={20} /> : <LuArrowBigLeft size={20} />}
            onClick={toggleCollapse}
            ariaLabel={collapsed ? "Ouvrir la barre latérale" : "Fermer la barre latérale"}
          />
        </div>

        <nav
          className={`flex flex-col justify-between max-h-[80%] ${
            collapsed ? "overflow-visible" : "overflow-hidden"
          } gap-2 py-4 flex-grow`}
        >
          <div>
            {sidebarItems
              .filter((item) => !item.permission || hasPermission(item.permission))
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
                          className="flex items-center px-8 h-8 cursor-pointer hover:bg-white hover:text-hoverText text-xs select-none"
                        >
                          <span className="mr-3">{item.icon}</span>
                          <span className="flex-1 whitespace-nowrap overflow-hidden">{item.name}</span>
                          <span
                            className={`transform transition-transform duration-200 ease-in-out ${
                              isOpen ? "rotate-90" : "rotate-0"
                            }`}
                          >
                            <BiChevronRight size={20} />
                          </span>
                        </div>
                        <ul
                          className={`ml-8 flex flex-col gap-2 py-2 text-xs overflow-hidden transition-all duration-500 ease-in-out ${
                            isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
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
                                    {child.children?.map((subChild) => (
                                      <li key={subChild.name}>
                                        <Link
                                          href={subChild.href!}
                                          className="flex items-center px-8 h-6 hover:bg-white hover:text-hoverText"
                                        >
                                          <span className="ml-5">{subChild.name}</span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }

                            return (
                              <li key={child.name}>
                                <Link
                                  href={child.href!}
                                  className="flex items-center px-8 h-6 hover:bg-white hover:text-hoverText"
                                >
                                  <span className="ml-5">{child.name}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : (
                      <Link
                        href={item.href!}
                        className="flex items-center px-8 h-8 hover:bg-white hover:text-hoverText transform transition-transform duration-200 ease-in-out text-xs mb-2"
                      >
                        <span className="mr-3">{item.icon}</span>
                          <span className="flex-1 whitespace-nowrap overflow-hidden">{item.name}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
          </div>

          <div
            className={`overflow-hidden flex items-center transition-all duration-300 ease-in-out ${
              collapsed ? "justify-center h-8 mt-8" : "justify-end h-16 mt-0"
            }`}
          >
            <button
              onClick={handleSignOut}
              className={`flex items-center justify-center transition-colors duration-200 ease-in-out cursor-pointer ${
                collapsed ? "" : "gap-2 h-10 w-fit p-2 border-y-2 border-l-2 rounded-l-md border-gray-200 hover:bg-white hover:text-hoverText"
              }`}
            >
              <VscSignOut size={20} />
              {!collapsed && (
                <span className="ml-2 duration-200 transition-all whitespace-nowrap overflow-hidden text-sm w-fit">
                  SE DÉCONNECTER
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
