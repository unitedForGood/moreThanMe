"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import Button from "../../components/Button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ContactFormSection from "../../components/ContactFormSection";
import ThanksFormSection from "../../components/ThanksFormSection";

export default function ContactPage() {
  const router = useRouter();
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
    <main>
      {/* Hero Section */}
      <section className="w-full bg-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-8">
              Get in Touch
            </span>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl lg:text-5xl font-bold text-primary-800 mb-8 leading-tight"
            >
              Connect With Our Mission
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Your voice matters! Whether you have questions, want to volunteer, or simply wish to connect, we&apos;re here for you. Together, we can create lasting change.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={() => router.push("/joinUs")}
                className="bg-transparent hover:bg-primary-50 text-primary-600 border-2 border-primary-600 font-semibold py-3 px-8 rounded-lg text-lg">
                Join Our Team
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="w-full bg-neutral-50 py-16 sm:py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              Get in touch
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-800 mb-2">Send us a message</h2>
            <p className="text-neutral-600">We&apos;ll reply as soon as we can. All submissions appear in the admin panel.</p>
          </motion.div>
          <ContactFormSection />
        </div>
      </section>

      {/* Thanks Section */}
      <section className="w-full bg-gradient-to-br from-primary-700 to-primary-600 py-16 sm:py-24 px-4">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
              Say thanks
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Thank MoreThanMe</h2>
            <p className="text-white/90">Optional name and message—or just click the button to send your thanks.</p>
          </motion.div>
          <ThanksFormSection />
        </div>
      </section>

      {/* Contact Methods Section */}
      <section className="w-full bg-neutral-50 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              Reach Out
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-primary-800 mb-6">How to Contact Us</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Choose the way that works best for you to connect with our team.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {email && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                    <Mail className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-800 mb-4">Email Us</h3>
                  <p className="text-neutral-600 leading-relaxed mb-4">
                    Send us a message and we&apos;ll get back to you within 24 hours.
                  </p>
                  <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-700 font-medium">
                    {email}
                  </a>
                </div>
              </motion.div>
            )}

            {phone && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                    <Phone className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-800 mb-4">Call Us</h3>
                  <p className="text-neutral-600 leading-relaxed mb-4">
                    Speak directly with our team for immediate assistance.
                  </p>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="block text-primary-600 hover:text-primary-700 font-medium">
                    {phone}
                  </a>
                </div>
              </motion.div>
            )}

            {address && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                    <MapPin className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-800 mb-4">Visit Us</h3>
                  <p className="text-neutral-600 leading-relaxed mb-4">
                    Find us at our university campus during office hours.
                  </p>
                  <span className="text-primary-600 font-medium whitespace-pre-line">
                    {address}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {!email && !phone && !address && (
            <p className="text-center text-neutral-500 py-12">Contact information will appear here once configured in the admin panel.</p>
          )}
        </div>
      </section>

      {/* Inspiring Quote Section */}
      <section className="w-full bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          >
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-8 border border-white/20">
                  Our Guiding Philosophy
                </span>
                
                <blockquote className="relative">
                  <div className="absolute -top-4 -left-4 text-6xl text-white/20 font-serif leading-none">&ldquo;</div>
                  <p className="text-3xl lg:text-4xl xl:text-5xl font-light text-white mb-8 leading-tight relative pl-8">
                    The best way to find yourself is to{" "}
                    <span className="font-medium text-orange-200">lose yourself</span>{" "}
                    in the service of others.
                  </p>
                  <div className="absolute -bottom-4 -right-4 text-6xl text-white/20 font-serif leading-none rotate-180">&rdquo;</div>
                </blockquote>
                
                <motion.footer
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex items-center gap-4 pl-8"
                >
                  <div className="w-12 h-0.5 bg-orange-300"></div>
                  <span className="text-xl text-orange-100 font-medium">Mahatma Gandhi</span>
                </motion.footer>
              </motion.div>
            </div>
            
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-300/30 to-transparent"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div className="text-white/80 text-sm font-medium">Service</div>
                    <div className="text-orange-200 text-xs">to Others</div>
                  </div>
                  <div className="absolute top-8 right-8 w-2 h-2 bg-orange-300/60 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-12 left-8 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <div className="absolute top-16 left-12 w-1 h-1 bg-orange-200/80 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
