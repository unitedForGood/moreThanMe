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
                  <p><a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a></p>
                </div>
              )}
              {phone && (
                <div>
                  <p className="font-medium text-neutral-200">Phone</p>
                  <p><a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">{phone}</a></p>
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
