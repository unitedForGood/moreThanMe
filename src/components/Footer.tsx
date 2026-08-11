"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
  const [settings, setSettings] = useState<{ contact_email?: string; contact_phone?: string; contact_address?: string }>({});

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const email = settings.contact_email || "";
  const phone = settings.contact_phone || "";
  const address = settings.contact_address || "";

  const copyToClipboard = (e: React.MouseEvent, text: string, label: string, href: string) => {
    e.preventDefault();
    
    const fallbackCopy = (val: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = val;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    };

    const showToastAndRedirect = () => {
      let toast = document.getElementById("clipboard-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "clipboard-toast";
        toast.className = "fixed bottom-6 right-6 bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 text-sm border border-neutral-800 transition-all duration-300 opacity-0 transform translate-y-2 pointer-events-none";
        document.body.appendChild(toast);
      }
      toast.innerHTML = `<div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span>${label} copied to clipboard!</span>`;
      
      setTimeout(() => {
        toast?.classList.remove("opacity-0", "translate-y-2");
        toast?.classList.add("opacity-100", "translate-y-0");
      }, 50);
      
      setTimeout(() => {
        if (toast) {
          toast.classList.remove("opacity-100", "translate-y-0");
          toast.classList.add("opacity-0", "translate-y-2");
        }
      }, 3000);

      setTimeout(() => {
        window.location.href = href;
      }, 150);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToastAndRedirect();
      }).catch(() => {
        fallbackCopy(text);
        showToastAndRedirect();
      });
    } else {
      fallbackCopy(text);
      showToastAndRedirect();
    }
  };

  return (
    <footer className="w-full bg-neutral-800 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="font-bold text-2xl flex items-center mb-4">
              <span className="text-primary-600">morethan</span>
              <span className="italic ml-1 text-primary-600">me</span>
            </Link>
            <p className="text-neutral-300 mb-4 leading-relaxed">
              A student-led initiative from Rishihood University, dedicated to uplifting communities across India through compassion, service, and meaningful change.
            </p>
            <p className="text-sm text-neutral-400">
              Student Organization<br />
              Rishihood University, Batch 2023
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Us</h3>
            <div className="space-y-3 text-sm text-neutral-300">
              {email && (
                <div>
                  <p className="font-medium text-neutral-200">Email</p>
                  <p>
                    <a 
                      href={`mailto:${email}`} 
                      onClick={(e) => copyToClipboard(e, email, "Email address", `mailto:${email}`)}
                      className="hover:text-white transition-colors"
                    >
                      {email}
                    </a>
                  </p>
                </div>
              )}
              {phone && (
                <div>
                  <p className="font-medium text-neutral-200">Phone</p>
                  <p>
                    <a 
                      href={`tel:${phone.replace(/\s/g, "")}`} 
                      onClick={(e) => copyToClipboard(e, phone, "Phone number", `tel:${phone.replace(/\s/g, "")}`)}
                      className="hover:text-white transition-colors"
                    >
                      {phone}
                    </a>
                  </p>
                </div>
              )}
              {address && (
                <div>
                  <p className="font-medium text-neutral-200">Address</p>
                  <p className="whitespace-pre-line">{address}</p>
                </div>
              )}
              {!email && !phone && !address && (
                <p className="text-neutral-400">Contact info configured in admin.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/about" className="block text-neutral-300 hover:text-white transition-colors">About Us</Link>
              <Link href="/works" className="block text-neutral-300 hover:text-white transition-colors">Our Works</Link>
              <Link href="/transparency" className="block text-neutral-300 hover:text-white transition-colors">Transparency</Link>
              <Link href="/contact" className="block text-neutral-300 hover:text-white transition-colors">Contact</Link>
              <Link href="/joinUs" className="block text-neutral-300 hover:text-white transition-colors">Join Us</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-400">
            <div>
              <p>&copy; {new Date().getFullYear()} MoreThanMe Initiative. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-neutral-300 transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-neutral-300 transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link href="/refund" className="hover:text-neutral-300 transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
