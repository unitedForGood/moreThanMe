"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RepublicDayFlowers from "./RepublicDayFlowers";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isVolunteer = pathname?.startsWith("/volunteer");

  if (isAdmin || isVolunteer) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <RepublicDayFlowers />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </>
  );
}
