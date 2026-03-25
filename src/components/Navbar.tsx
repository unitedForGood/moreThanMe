"use client";
import Link from "next/link";
import Image from "next/image";
import Button from "./Button";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { getTodaySpecialDay, type SpecialDay } from "@/config/specialDays";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [specialDay, setSpecialDay] = useState<SpecialDay | null>(null);

  // Check if today is a special day
  useEffect(() => {
    const todaySpecialDay = getTodaySpecialDay();
    setSpecialDay(todaySpecialDay);

    // Add class to body for padding adjustment
    if (todaySpecialDay) {
      document.body.classList.add("special-day-navbar");
    } else {
      document.body.classList.remove("special-day-navbar");
    }

    return () => {
      document.body.classList.remove("special-day-navbar");
    };
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDonate = () => {
    router.push("/donate");
  };
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About us" },
    { href: "/our-family", label: "Our Family" },
    { href: "/works", label: "Our Works" },
    { href: "/contact", label: "Contact" },
    { href: "/transparency", label: "Transparency" },
  ];
  return (
    <nav 
      className={`fixed top-0 w-full transition-all duration-300 ease-out z-50 ${
        specialDay
          ? 'shadow-lg'
          : isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-neutral-100' 
            : 'bg-white/90 backdrop-blur-sm shadow-sm'
      }`}
      style={
        specialDay
          ? {
              background: `linear-gradient(to right, ${specialDay.colors.primary}, ${specialDay.colors.middle}, ${specialDay.colors.secondary})`,
            }
          : undefined
      }
    >
      {/* Special Day Message - Above Nav Links */}
      {specialDay && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full py-2 px-4 sm:px-8"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="hidden sm:flex"
            >
              <Flag className="w-5 h-5" style={{ color: specialDay.colors.accent }} />
            </motion.div>
            <motion.h2
              className="text-sm sm:text-base md:text-lg font-extrabold text-center"
              style={{ color: specialDay.colors.text }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {specialDay.emoji} {specialDay.message} {new Date().getFullYear()} {specialDay.emoji}
            </motion.h2>
            {specialDay.hindiMessage && (
              <motion.p
                className="hidden md:block text-xs sm:text-sm font-semibold"
                style={{ color: specialDay.colors.text }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {specialDay.hindiMessage}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Navbar Content */}
      <div className={`flex items-center justify-between px-4 sm:px-8 ${
        specialDay ? 'py-3' : isScrolled ? 'py-3' : 'py-4'
      }`}>
        {/* Logo */}
        <Link href="/" className="flex items-center cursor-pointer focus:outline-none focus-visible:outline-none" aria-label="Go to home page">
          <Image
            src="/morethanmelogo.png"
            alt="MoreThanMe Logo"
            width={150}
            height={40}
            className="h-10 w-auto mr-3"
            priority
          />
          <span 
            className={`font-bold text-2xl transition-all duration-300 hidden lg:inline ${
              specialDay 
                ? '' 
                : isScrolled 
                  ? 'text-primary-800 scale-95' 
                  : 'text-primary-800 scale-100'
            }`}
            style={specialDay ? { color: specialDay.colors.text } : undefined}
          >
            morethan<span 
              className="italic ml-1"
              style={specialDay ? { color: specialDay.colors.text } : undefined}
            >
              me
            </span>
          </span>
        </Link>
        {/* Hamburger for mobile and tablet */}
        <button
          className="lg:hidden ml-auto p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-600"
          style={{ color: specialDay ? specialDay.colors.text : '#374151' }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        {/* Centered Nav Links - Desktop */}
        <div className="hidden lg:flex flex-1 justify-center">
          <div className="flex gap-8 text-base font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative py-2 px-1 focus:outline-none focus-visible:outline-none group"
              >
                <span 
                  className={`transition-colors duration-300 ${
                    specialDay
                      ? pathname === link.href
                        ? "font-bold"
                        : "opacity-80 group-hover:opacity-100"
                      : pathname === link.href 
                        ? "text-primary-600" 
                        : "text-neutral-700 group-hover:text-primary-600"
                  }`}
                  style={specialDay ? { color: specialDay.colors.text } : undefined}
                >
                  {link.label}
                </span>
                {/* Animated Underline */}
                <span 
                  className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out ${
                    pathname === link.href 
                      ? "w-full" 
                      : "w-0 group-hover:w-full"
                  }`}
                  style={{ 
                    backgroundColor: specialDay ? specialDay.colors.accent : '#A51C30',
                  }}
                ></span>
              </Link>
            ))}
          </div>
        </div>
        {/* Donate Button - Desktop */}
        <div className="hidden lg:block">
          <Button
            onClick={handleDonate}
            className="px-6 py-2 rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus-visible:outline-none text-white"
            style={{
              backgroundColor: specialDay ? specialDay.colors.accent : "#A51C30",
            }}
            onMouseEnter={(e) => {
              if (specialDay) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              if (specialDay) {
                e.currentTarget.style.opacity = "1";
              }
            }}
          >
            Donate
          </Button>
        </div>
      </div>
      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0" 
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            zIndex: 9998
          }}
          onClick={() => setMenuOpen(false)} 
        />
      )}
      <div
        className={`fixed top-0 right-0 transform transition-transform duration-300 ease-in-out lg:hidden
        ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ 
          background: specialDay 
            ? `linear-gradient(to bottom, ${specialDay.colors.primary}, ${specialDay.colors.middle}, ${specialDay.colors.secondary})`
            : '#ffffff',
          opacity: '1',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          height: '100vh',
          width: '256px',
          zIndex: 9999,
          boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
          borderLeft: specialDay ? `2px solid ${specialDay.colors.accent}` : '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          right: 0
        }}
      >
        <button
          className="self-end p-2 rounded text-neutral-700"
          style={{ 
            backgroundColor: '#ffffff',
            margin: '16px',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          <X size={28} />
        </button>
        <nav style={{ 
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          padding: '0 32px',
          marginTop: '32px',
          fontSize: '18px',
          fontWeight: '500'
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="relative rounded transition-all duration-300"
              style={{ 
                backgroundColor: pathname === link.href ? '#fef2f2' : '#ffffff',
                color: pathname === link.href ? '#A51C30' : '#3f3f46',
                padding: '8px 12px',
                textDecoration: 'none',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              {link.label}
            </Link>
          ))}

          <Button
            onClick={() => {
              setMenuOpen(false);
              handleDonate();
            }}
            className="w-full rounded-lg font-semibold transition-colors duration-200"
            style={{ 
              backgroundColor: specialDay ? specialDay.colors.accent : '#A51C30',
              color: '#ffffff',
              padding: '12px 24px',
              marginTop: '16px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Donate
          </Button>
        </nav>
      </div>
    </nav>
  );
} 