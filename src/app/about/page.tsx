"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Button from "../../components/Button";
import { useRouter } from "next/navigation";
import {
  Heart,
  Users,
  Lightbulb,
  Target,
  Quote,
  Calendar,
  MapPin,
  Sparkles,
  UserCircle2,
  Mail,
  Phone,
  Linkedin,
} from "lucide-react";

type TeamMember = {
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  image_url?: string | null;
  linkedin?: string | null;
};

const values = [
  {
    icon: Heart,
    title: "Compassion",
    description: "We lead with empathy and kindness in every initiative and interaction.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Students, partners, and volunteers together create lasting change.",
  },
  {
    icon: Lightbulb,
    title: "Growth",
    description: "Practical learning and skill-building at the heart of what we do.",
  },
  {
    icon: Target,
    title: "Impact",
    description: "Every action is aimed at real, measurable difference in people's lives.",
  },
];

const milestones = [
  { year: "Ideation", label: "Conversations during internships sparked the idea." },
  { year: "Mentorship", label: "Encouragement from Paroksh Sir and mentors to take action." },
  { year: "Launch", label: "MoreThanMe took shape with workshops and events." },
  { year: "Today", label: "A growing movement across Rishihood and beyond." },
];

const FEATURED_CAROUSEL_INTERVAL_MS = 4500;
const isVideoUrl = (src: string) =>
  src.toLowerCase().includes("/video/") || src.toLowerCase().endsWith(".mp4") || src.toLowerCase().endsWith(".webm");

export default function AboutPage() {
  const router = useRouter();
  const [foundingMembers, setFoundingMembers] = useState<TeamMember[]>([]);
  const [storyImageUrl, setStoryImageUrl] = useState<string | null>(null);
  const [featuredPhotos, setFeaturedPhotos] = useState<{ src: string; alt: string }[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [storyImageLoaded, setStoryImageLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const founding = data
            .filter((m: { is_founding_member?: boolean }) => !!m.is_founding_member)
            .map((m: { name: string; role: string; email?: string | null; phone?: string | null; image_url?: string | null; linkedin?: string | null }) => ({
              name: m.name,
              role: m.role,
              email: m.email ?? undefined,
              phone: m.phone ?? undefined,
              image_url: m.image_url ?? undefined,
              linkedin: m.linkedin ?? undefined,
            }));
          setFoundingMembers(founding);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((data) => {
        const aboutImg = Array.isArray(data) ? data.find((a: { category?: string }) => a.category === "About") : null;
        if (aboutImg?.url) setStoryImageUrl(aboutImg.url);
        else if (Array.isArray(data) && data.length > 0) setStoryImageUrl(data[0].url);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/gallery/featured")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const imagesOnly = data
            .filter((p: { src?: string }) => p.src && !isVideoUrl(p.src))
            .map((p: { src: string; alt?: string }) => ({ src: p.src, alt: p.alt || "Our story" }));
          setFeaturedPhotos(imagesOnly);
        }
      })
      .catch(() => {});
  }, []);

  const hasFeaturedSlideshow = featuredPhotos.length > 0;

  useEffect(() => {
    if (!hasFeaturedSlideshow) return;
    const t = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % featuredPhotos.length);
    }, FEATURED_CAROUSEL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [hasFeaturedSlideshow, featuredPhotos.length]);

  useEffect(() => {
    setStoryImageLoaded(false);
  }, [featuredIndex, storyImageUrl, hasFeaturedSlideshow]);

  const showStoryMedia = hasFeaturedSlideshow || storyImageUrl;

  const optimizeCloudinaryUrl = (url: string) => {
    if (typeof url !== "string" || !url.includes("cloudinary.com")) return url;
    if (url.includes("/image/upload/w_") || url.includes("/image/upload/c_")) return url;
    return url.replace("/image/upload/", "/image/upload/w_600,q_80,f_auto/");
  };

  return (
    <main className="overflow-x-hidden">
      {/* Our Story Section */}
      <section className="w-full bg-white pt-28 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16"
          >
            <div className="flex-1 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
                  Our Journey
                </span>
                <h2 className="text-4xl lg:text-5xl font-bold text-primary-800 mb-6 leading-tight">
                  Our Story
                </h2>
                <p className="text-xl text-neutral-600 mb-6 leading-relaxed">
                  Founded by passionate students, our initiative began as a small
                  effort to help local communities. Today, we unite students,
                  partners, and volunteers to create a ripple effect of positive
                  change across India.
                </p>
                <p className="text-lg text-neutral-500 leading-relaxed">
                  Every project, every act of kindness, and every smile shared is
                  a step toward a brighter future for all.
                </p>
              </motion.div>
            </div>
            {showStoryMedia && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex-1 max-w-lg w-full"
              >
                <div className="relative group aspect-[5/4] rounded-2xl overflow-hidden shadow-xl bg-primary-100">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-sm -z-10" />
                  {!storyImageLoaded && (
                    <div className="absolute inset-0 bg-primary-100 animate-pulse" aria-hidden="true" />
                  )}
                  {hasFeaturedSlideshow ? (
                    <>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={featuredIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={optimizeCloudinaryUrl(featuredPhotos[featuredIndex].src)}
                            alt={featuredPhotos[featuredIndex].alt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 512px"
                            className="object-cover"
                            priority
                            onLoad={() => setStoryImageLoaded(true)}
                          />
                        </motion.div>
                      </AnimatePresence>
                      {featuredPhotos.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                          {featuredPhotos.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setFeaturedIndex(i)}
                              className={`h-2 rounded-full transition-all ${
                                i === featuredIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
                              }`}
                              aria-label={`Go to image ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : storyImageUrl ? (
                    <Image
                      src={optimizeCloudinaryUrl(storyImageUrl)}
                      alt="Our Story - community and impact"
                      fill
                      sizes="(max-width: 1024px) 100vw, 512px"
                      className="object-cover"
                      priority
                      onLoad={() => setStoryImageLoaded(true)}
                    />
                  ) : null}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Founding Members Section */}
      <section className="w-full bg-neutral-50 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              The People Behind the Idea
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-primary-800 mb-4 leading-tight">
              Founding Members
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              The students who turned a conversation into a movement—from Rishihood University and Newton School, Batch of 2023.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {foundingMembers.length > 0 ? foundingMembers.map((member, idx) => (
              <motion.div
                key={member.name + (member.email ?? "")}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-neutral-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden bg-primary-100 border-2 border-primary-100">
                  {member.image_url ? (
                    <Image
                      src={member.image_url}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-primary-800 mb-1">{member.name}</h3>
                <p className="text-primary-600 font-medium text-sm mb-4">{member.role}</p>
                <div className="flex flex-col items-center gap-1.5 text-sm">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-primary-600 transition-colors"
                      aria-label={`Email ${member.name}`}
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[180px]">{member.email}</span>
                    </a>
                  )}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-primary-600 transition-colors"
                      aria-label={`Phone ${member.name}`}
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{member.phone}</span>
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-[#0A66C2] transition-colors mt-0.5"
                      aria-label={`${member.name} on LinkedIn`}
                    >
                      <Linkedin className="w-4 h-4 shrink-0" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </motion.div>
            )) : (
              <p className="col-span-full text-center text-neutral-500 py-8">Founding members will appear here. Mark team members as &ldquo;Founding member&rdquo; in the admin Team page.</p>
            )}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="w-full bg-white py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              What We Stand For
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-primary-800 mb-4 leading-tight">
              Our Values
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              The principles that guide every decision and every action we take.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-neutral-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                  <item.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-primary-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Started Section */}
      <section className="w-full bg-white py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-8">
              Our Beginning
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-primary-800 mb-8 leading-tight">
              How We Started
            </h2>
            <p className="text-xl text-neutral-600 mb-14 max-w-4xl mx-auto leading-relaxed">
              From a simple idea during internships to a student-powered movement
              of change across India.
            </p>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14"
            >
              {milestones.map((m, i) => (
                <div
                  key={m.year}
                  className="relative flex flex-col items-center text-center p-4"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-sm mb-3">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-primary-800 mb-1">{m.year}</h3>
                  <p className="text-sm text-neutral-600">{m.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Story card with quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-primary-50 rounded-2xl shadow-sm p-8 sm:p-10 max-w-4xl mx-auto border border-primary-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-6">
                  <p className="text-lg text-neutral-600 leading-relaxed">
                    The idea for MoreThanMe began during conversations among
                    friends while we were interning and reflecting on our own
                    growth. We realized that structured learning opportunities
                    and collaborative discussions can create meaningful impact
                    for students.
                  </p>
                  <div className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-primary-100">
                    <Quote className="w-8 h-8 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-neutral-700 font-medium italic">
                        With encouragement from our teachers and mentors,
                        especially Paroksh Sir, we decided to turn this idea
                        into action.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-lg text-neutral-600 leading-relaxed">
                    Today, MoreThanMe organizes workshops, skill-development
                    sessions, and campus-based events focused on personal and
                    professional growth. To support event logistics, materials,
                    and operations, we collect a fixed participation fee for
                    each event.
                  </p>
                  <p className="text-lg text-neutral-600 leading-relaxed">
                    Our mission is to create practical learning experiences that
                    inspire growth, responsibility, and community engagement.
                  </p>
                </div>
              </div>
              <div className="w-16 h-1 bg-primary-600 rounded-full mx-auto mt-8" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Impact / Where we are */}
      <section className="w-full bg-gradient-to-br from-primary-800 to-primary-700 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-8">
              <MapPin className="w-4 h-4" />
              Our Reach
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Student-Led, India-Wide
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed">
              From Rishihood University to communities across India—workshops,
              events, and acts of kindness that create real impact.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-8 sm:gap-12"
            >
              {[
                { icon: Users, label: "Students & volunteers", value: "Growing community" },
                { icon: Calendar, label: "Events & workshops", value: "Ongoing" },
                { icon: Sparkles, label: "Mission", value: "Impact-first" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-white/90"
                >
                  <item.icon className="w-10 h-10 mb-2 opacity-90" />
                  <span className="font-semibold text-white">{item.value}</span>
                  <span className="text-sm text-white/80">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-primary-50 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-800 mb-4 leading-tight">
              Be Part of Our Story
            </h2>
            <p className="text-lg text-neutral-600 mb-8">
              Join as a volunteer, attend a workshop, or support our mission.
              Every step counts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/joinUs")}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg shadow-sm text-lg w-full sm:w-auto"
              >
                Join Us
              </Button>
              <Button
                onClick={() => router.push("/contact")}
                className="bg-white hover:bg-neutral-50 text-primary-700 border-2 border-primary-200 font-semibold py-3 px-8 rounded-lg text-lg w-full sm:w-auto"
              >
                Get in Touch
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
