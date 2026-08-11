"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Mail, Phone } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  image_url?: string | null;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      setToastMessage(`${label} copied to clipboard!`);
      setTimeout(() => setToastMessage(null), 3000);
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

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => setTeamMembers(Array.isArray(data) ? data : []))
      .catch(() => setTeamMembers([]))
      .finally(() => setLoading(false));
  }, []);

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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-8 shadow-sm">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl lg:text-5xl font-bold text-primary-800 mb-8 leading-tight"
            >
              Meet Our Team
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Passionate students from Rishihood University and Newton School, dedicated to creating meaningful social impact through compassionate service.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Core Team Section */}
      <section className="w-full bg-neutral-50 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              Leadership Team
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-primary-800 mb-6">Core Team Members</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              The dedicated students leading our initiatives and driving change in the community.
            </p>
          </motion.div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center text-neutral-500 py-12">Loading team...</div>
            ) : teamMembers.length === 0 ? (
              <div className="col-span-full text-center text-neutral-500 py-12">No team members yet.</div>
            ) : (
              teamMembers.map((member, idx) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 * ((idx % 3) + 1) }}
                >
                  <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 h-full">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden">
                      {member.image_url ? (
                        <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-12 h-12 text-primary-600" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-primary-800 mb-2">{member.name}</h3>
                    <p className="text-primary-600 font-medium mb-4">{member.role}</p>
                    <div className="flex justify-center gap-3">
                      {member.email && (
                        <a 
                          href={`mailto:${member.email}`} 
                          onClick={(e) => copyToClipboard(e, member.email || "", "Email address", `mailto:${member.email}`)}
                          className="text-neutral-400 hover:text-primary-600 transition-colors" 
                          aria-label="Email"
                        >
                          <Mail className="w-5 h-5" />
                        </a>
                      )}
                      {member.phone && (
                        <a 
                          href={`tel:${member.phone.replace(/\s/g, "")}`} 
                          onClick={(e) => copyToClipboard(e, member.phone || "", "Phone number", `tel:${member.phone.replace(/\s/g, "")}`)}
                          className="text-neutral-400 hover:text-primary-600 transition-colors" 
                          aria-label="Call"
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      )}
                      {!member.email && !member.phone && (
                        <>
                          <a 
                            href="mailto:morethanme@rishihood.edu.in" 
                            onClick={(e) => copyToClipboard(e, "morethanme@rishihood.edu.in", "Email address", "mailto:morethanme@rishihood.edu.in")}
                            className="text-neutral-400 hover:text-primary-600 transition-colors" 
                            aria-label="Email"
                          >
                            <Mail className="w-5 h-5" />
                          </a>
                          <a 
                            href="tel:+917541062514" 
                            onClick={(e) => copyToClipboard(e, "+91 7541062514", "Phone number", "tel:+917541062514")}
                            className="text-neutral-400 hover:text-primary-600 transition-colors" 
                            aria-label="Call"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Volunteers Section removed as requested */}

      {/* Call to Action Section */}
      <section className="w-full bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Join Our Team
            </h2>
            <p className="text-xl text-neutral-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Want to make a difference? Join us in our mission to create positive change in communities across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/joinUs"
                className="inline-block bg-white text-primary-600 hover:bg-primary-50 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Become a Volunteer
              </a>
              <a
                href="/contact"
                className="inline-block bg-transparent text-white hover:bg-white/10 border-2 border-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 text-sm border border-neutral-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}

