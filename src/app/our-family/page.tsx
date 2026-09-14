"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Heart, TrendingUp, Search, X } from "lucide-react";
import Button from "../../components/Button";

interface Donor {
  id: string;
  name: string;
  status: string;
  created_at: string;
  message?: string;
}

interface Volunteer {
  id: string;
  name: string;
  role: string;
  is_core_member?: boolean;
  image_url?: string | null;
  university_email: string;
  enrollment: string;
  batch: string;
  course?: string;
  phone?: string;
  message?: string;
  created_at?: string | unknown;
}

export default function OurFamilyPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalDonors: 0,
    verifiedDonors: 0,
    totalVolunteers: 0
  });

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([]);
  
  // Toggle states: "core" = Our Core Team, "volunteers" = Volunteers only
  const [activeSection, setActiveSection] = useState<"core" | "volunteers">("core");

  useEffect(() => {
    fetchData();
  }, []);

  const coreTeam = volunteers.filter((v) => v.is_core_member);
  const volunteersOnly = volunteers.filter((v) => v.role === "Volunteer");
  const listForSection = activeSection === "core" ? coreTeam : volunteersOnly;

  const searchLower = searchTerm.trim().toLowerCase();
  const displayedTeamList = searchLower
    ? listForSection.filter(
        (v) =>
          v.name.toLowerCase().includes(searchLower) ||
          v.id.toLowerCase().includes(searchLower) ||
          (v.university_email && v.university_email.toLowerCase().includes(searchLower)) ||
          (v.enrollment && v.enrollment.toLowerCase().includes(searchLower)) ||
          (v.course && v.course.toLowerCase().includes(searchLower)) ||
          (v.message && v.message.toLowerCase().includes(searchLower))
      )
    : listForSection;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [donorsRes, teamRes, statsRes] = await Promise.all([
        fetch("/api/donations/donors"),
        fetch("/api/team"),
        fetch("/api/donations/stats"),
      ]);
      const donorsData = await donorsRes.json().catch(() => []);
      const teamList = await teamRes.json().catch(() => []);
      const statsData = await statsRes.json().catch(() => ({}));

      const volunteersData: Volunteer[] = (teamList || []).map((m: Record<string, unknown>) => ({
        id: String(m.id || ""),
        name: String(m.name || ""),
        role: String(m.role || "Volunteer"),
        is_core_member: !!(m.is_core_member === true),
        image_url: (m.image_url as string) || null,
        university_email: String(m.email || m.university_email || ""),
        enrollment: String(m.enrollment || ""),
        batch: String(m.batch || ""),
        course: String(m.course || "OTHER"),
        phone: m.phone as string | undefined,
        message: (m.why_join ?? m.message) as string | undefined,
        created_at: m.created_at,
      }));

      setDonors(Array.isArray(donorsData) ? donorsData : []);
      setVolunteers(volunteersData);
      setFilteredDonors(Array.isArray(donorsData) ? donorsData : []);
      setFilteredVolunteers(volunteersData);
      setStats({
        totalDonors: statsData.verified_donations ?? donorsData?.length ?? 0,
        verifiedDonors: statsData.verified_donations ?? donorsData?.length ?? 0,
        totalVolunteers: volunteersData.length,
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load our family members");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateVal?: string | unknown) => {
    if (dateVal == null) return "Recently joined";
    let date: Date;
    const o = dateVal as Record<string, unknown>;
    if (typeof dateVal === "object" && dateVal !== null && typeof o?.toDate === "function") {
      date = (o.toDate as () => Date)();
    } else if (typeof dateVal === "object" && dateVal !== null && (typeof o?._seconds === "number" || typeof o?.seconds === "number")) {
      const sec = Number(o._seconds ?? o.seconds);
      date = new Date(sec * 1000);
    } else if (typeof dateVal === "string" || typeof dateVal === "number") {
      date = new Date(dateVal);
    } else {
      return "Recently joined";
    }
    if (Number.isNaN(date.getTime())) return "Recently joined";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getCourseDisplayName = (course: string) => {
    const courseMap: { [key: string]: string } = {
      'BTECH': 'B.Tech',
      'BDES': 'B.Des',
      'BBA': 'BBA',
      'PSYCH': 'Psychology',
      'CSAI': 'CSAI',
      'OTHER': 'Other'
    };
    return courseMap[course] || course;
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-primary-600 text-lg">Loading our amazing family...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Button 
              onClick={fetchData}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-8 border border-white/20">
              Our Growing Community
            </span>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight"
            >
            Our Amazing Family
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Every donation creates ripples of hope. Every volunteer amplifies our impact. 
              Together, we&apos;re building a community that transforms lives across India—one act of kindness at a time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stats.verifiedDonors}</div>
                <div className="text-white/80">Generous Hearts</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stats.totalVolunteers}</div>
                <div className="text-white/80">Dedicated Volunteers</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stats.verifiedDonors + stats.totalVolunteers}</div>
                <div className="text-white/80">Lives Connected</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Impact Story Section */}
      <section className="w-full bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              The Power of Community
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-800 mb-6">Every Member Makes a Difference</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Behind every number is a story. Behind every story is hope. Our family members don&apos;t just contribute—they create lasting change.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="bg-primary-50 rounded-2xl p-8 border border-primary-100">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-800 mb-2">From Students, For Communities</h3>
                    <p className="text-neutral-600 leading-relaxed">
                      What started as a simple idea during our internships has grown into a movement. Our donors and volunteers span across India, united by a shared vision of positive change.
                    </p>
                  </div>
        </div>

                <div className="bg-white rounded-xl p-6 border border-primary-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary-800">100%</div>
                      <div className="text-sm text-neutral-600">Transparency</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary-800">24/7</div>
                      <div className="text-sm text-neutral-600">Community Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-sm">A</span>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Anonymous Donor</div>
                    <div className="text-sm text-neutral-500">Family Member since 2024</div>
                  </div>
                </div>
                <p className="text-neutral-600 italic leading-relaxed">
                  &ldquo;Seeing young minds dedicated to helping others gives me hope. Every contribution feels meaningful here.&rdquo;
                </p>
            </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-sm">V</span>
          </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Volunteer Team Member</div>
                    <div className="text-sm text-neutral-500">Rishihood University</div>
            </div>
          </div>
                <p className="text-neutral-600 italic leading-relaxed">
                  &ldquo;Being part of this community taught me that even small actions can create significant impact.&rdquo;
                </p>
            </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">

        {/* Toggle Section */}
        <section className="w-full bg-neutral-50 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 pb-0">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                Meet Our Community
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-primary-800 mb-6">
                Discover Who Makes It All Possible
            </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-12">
                Our core team and volunteers who bring our mission to life—every one of them plays a vital role in creating positive change.
            </p>
          
          <div className="flex justify-center">
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 max-w-2xl w-full p-2">
              <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveSection("core")}
                className={`w-full py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                  activeSection === "core"
                    ? "bg-primary-600 text-white shadow-lg"
                    : "text-neutral-600 hover:text-primary-600 hover:bg-primary-50"
                }`}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Our Core Team ({coreTeam.length})</span>
              </button>
              <button
                onClick={() => setActiveSection("volunteers")}
                className={`w-full py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                  activeSection === "volunteers"
                    ? "bg-primary-600 text-white shadow-lg"
                    : "text-neutral-600 hover:text-primary-600 hover:bg-primary-50"
                }`}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Volunteers ({volunteersOnly.length})</span>
              </button>
            </div>
          </div>
        </div>
            </motion.div>
            

          </div>
        </section>

        {/* Team Section - Core Team or Volunteers */}
        <section className="w-full bg-neutral-50 pt-8 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl font-bold text-primary-800 mb-6">
                  {activeSection === "core" ? "Our Core Team" : "Our Volunteers"}
                </h2>
                <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                  {activeSection === "core"
                    ? "The core team who lead and drive our mission forward."
                    : "Dedicated volunteers from Rishihood University who bring our mission to life through their passion and commitment."}
                </p>
              
              {/* Search Bar */}
                <div className="max-w-md mx-auto mt-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 pr-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-neutral-900 shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-neutral-400" />
                  </div>
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <p className="text-sm text-neutral-600 mt-2">
                    Found {displayedTeamList.length} {activeSection === "core" ? "core team" : "volunteer"} members
                  </p>
                )}
              </div>
              </motion.div>

            {displayedTeamList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
                  {displayedTeamList.map((volunteer, index) => (
                    <motion.div 
                    key={volunteer.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden bg-primary-100 group-hover:bg-primary-200 transition-colors shrink-0">
                          {volunteer.image_url ? (
                            <img
                              src={volunteer.image_url}
                              alt={volunteer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl text-primary-600 font-bold">
                              {volunteer.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                      </div>
                        <h3 className="text-xl font-bold text-primary-800 mb-2">
                        {volunteer.name}
                      </h3>
                        <div className="text-sm text-neutral-500 mb-2">
                        {getCourseDisplayName(volunteer.course || 'OTHER')} • Batch {volunteer.batch}
                      </div>
                        <div className="text-xs text-neutral-400 mb-2">
                        {volunteer.enrollment}
                      </div>
                        <div className="text-xs text-neutral-400 mb-3">
                        {volunteer.university_email}
                      </div>
                      {volunteer.created_at != null ? (
                          <div className="text-xs text-neutral-400 mb-3">
                          Joined on {formatDate(volunteer.created_at)}
                        </div>
                      ) : null}
                      {volunteer.message && (
                          <div className="text-sm text-neutral-600 italic mb-3">
                            &ldquo;{volunteer.message}&rdquo;
                        </div>
                      )}
                      <div className="mt-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            <Users className="w-3 h-3 mr-1" />
                            {activeSection === "core" ? "Core Team" : "Volunteer"}
                          </span>
                      </div>
                    </div>
                    </motion.div>
                ))}
              </div>
            ) : listForSection.length > 0 ? (
              <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-700 mb-4">
                    No {activeSection === "core" ? "core team" : "volunteer"} members found
                  </h3>
                  <p className="text-neutral-600">
                    Try adjusting your search terms.
                  </p>
              </div>
            ) : (
              <div className="text-center py-12">
                  <div className="bg-primary-50 rounded-3xl p-8 border border-primary-200">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Users className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary-800 mb-4">
                      {activeSection === "core" ? "No core team members yet" : "Join Our Amazing Team!"}
                    </h3>
                    <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
                      {activeSection === "core"
                        ? "Core team members are marked in the admin panel. Check back later."
                        : "We're looking for passionate volunteers to join our mission. Be part of our team and help us make a real difference."}
                    </p>
                    {activeSection === "volunteers" && (
                      <Button
                        onClick={() => window.location.href = '/joinUs'}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg"
                      >
                        Join Our Team
                      </Button>
                    )}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Call to Action */}
      <section className="w-full bg-primary-50 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white text-primary-700 text-sm font-medium mb-8 shadow-sm">
                Join Us Today
              </span>
              
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-800 mb-6 leading-tight"
              >
              Ready to Join Our Family?
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="text-lg sm:text-xl text-neutral-600 mb-8 sm:mb-10 leading-relaxed"
              >
                Every contribution makes a difference. Be part of our mission to create positive change.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
              >
                <Button
                  onClick={() => window.location.href = '/donate'}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg text-lg"
                >
                  Donate Now
                </Button>
                <Button
                  onClick={() => window.location.href = '/joinUs'}
                  className="bg-transparent hover:bg-primary-50 text-primary-600 border-2 border-primary-600 font-semibold py-3 px-8 rounded-lg text-lg"
              >
                Join Our Team
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
    </main>
  );
} 