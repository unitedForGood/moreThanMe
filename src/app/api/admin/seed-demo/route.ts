import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const expectedKey = process.env.ADMIN_SEED_KEY;
  const allowedByKey = expectedKey && key === expectedKey;
  const admin = await getAdminFromRequest(request);
  if (!admin && !allowedByKey) return NextResponse.json({ error: "Unauthorized. Log in as admin or pass ?key=YOUR_ADMIN_SECRET" }, { status: 401 });

  try {
    const batch = adminDb.batch();

    // 1. Site settings (use set with merge so we don't overwrite)
    const heroUrl = "https://res.cloudinary.com/dpuhlmcth/image/upload/v1753466891/DSC1803-scaled_enhcsi.jpg";
    batch.set(adminDb.collection("site_settings").doc("contact_email"), { value: "unitedforgood2025@gmail.com" }, { merge: true });
    batch.set(adminDb.collection("site_settings").doc("contact_phone"), { value: "+91 7541062514" }, { merge: true });
    batch.set(adminDb.collection("site_settings").doc("contact_address"), { value: "Rishihood University, Sonipat, Haryana, India" }, { merge: true });
    batch.set(adminDb.collection("site_settings").doc("hero_image_url"), { value: heroUrl }, { merge: true });
    batch.set(adminDb.collection("site_settings").doc("featured_video_url"), { value: "" }, { merge: true });

    await batch.commit();
  } catch (e) {
    console.error("Seed demo batch 1:", e);
  }

  try {
    // 2. Team members (only if empty)
    const teamSnap = await adminDb.collection("team_members").limit(1).get();
    if (teamSnap.empty) {
      const team = [
        { name: "Sourabh Sarkar", role: "Finance and Social Media", sort_order: 1 },
        { name: "Akash", role: "Finance", sort_order: 2 },
        { name: "Monu Kumar", role: "POC & Outreaches", sort_order: 3 },
        { name: "Manish Kumar", role: "POC & Outreaches", sort_order: 4 },
        { name: "Shreya Narayani", role: "Outreaches and Social Media", sort_order: 5 },
        { name: "Kartik Reddy", role: "Event & Resource Management", sort_order: 6 },
        { name: "Murli", role: "Media Management", sort_order: 7 },
      ];
      for (const m of team) {
        await adminDb.collection("team_members").add({ ...m, created_at: new Date() });
      }
    }
  } catch (e) {
    console.error("Seed demo team:", e);
  }

  try {
    // 3. Volunteers
    const volSnap = await adminDb.collection("volunteers").limit(1).get();
    if (volSnap.empty) {
      const volunteers = [
        { name: "Demo User One", university_email: "demo1@rishihood.edu.in", enrollment: "RU2023001", batch: "2023", course: "CSAI", phone: "9876543210", message: "Excited to join!", created_at: new Date() },
        { name: "Demo User Two", university_email: "demo2@rishihood.edu.in", enrollment: "RU2023002", batch: "2023", course: "BBA", phone: "9876543211", message: "", created_at: new Date() },
        { name: "Demo User Three", university_email: "demo3@rishihood.edu.in", enrollment: "RU2023003", batch: "2024", course: "CSAI", phone: "", message: "Looking forward.", created_at: new Date() },
      ];
      for (const v of volunteers) {
        await adminDb.collection("volunteers").add(v);
      }
    }
  } catch (e) {
    console.error("Seed demo volunteers:", e);
  }

  try {
    // 4. Donations
    const donSnap = await adminDb.collection("donations").limit(1).get();
    if (donSnap.empty) {
      const donations = [
        { name: "Demo Donor 1", amount: 5000, transaction_id: "DEMO-TXN-001", status: "verified", verified_at: new Date(), created_at: new Date() },
        { name: "Demo Donor 2", amount: 2500, transaction_id: "DEMO-TXN-002", status: "verified", verified_at: new Date(), created_at: new Date() },
        { name: "Demo Donor 3", amount: 1000, transaction_id: "DEMO-TXN-003", status: "pending_verification", verified_at: null, created_at: new Date() },
      ];
      for (const d of donations) {
        await adminDb.collection("donations").add(d);
      }
    }
  } catch (e) {
    console.error("Seed demo donations:", e);
  }

  try {
    // 5. Newsletters
    const newsSnap = await adminDb.collection("newsletters").limit(1).get();
    if (newsSnap.empty) {
      await adminDb.collection("newsletters").add({
        title: "January 2025 Newsletter",
        description: "Demo newsletter for testing.",
        category: "monthly",
        file_path: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample",
        created_at: new Date(),
      });
      await adminDb.collection("newsletters").add({
        title: "Weekly Update",
        description: "This week's highlights.",
        category: "weekly",
        file_path: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample",
        created_at: new Date(),
      });
    }
  } catch (e) {
    console.error("Seed demo newsletters:", e);
  }

  try {
    // 6. Newsletter sends
    const sendSnap = await adminDb.collection("newsletter_sends").limit(1).get();
    if (sendSnap.empty) {
      await adminDb.collection("newsletter_sends").add({
        newsletter_id: null,
        subject: "Demo: New Newsletter from MoreThanMe",
        recipient_count: 2,
        recipient_emails: ["demo1@rishihood.edu.in", "demo2@rishihood.edu.in"],
        sent_by: admin?.email || "seed-demo",
        sent_at: new Date(),
      });
    }
  } catch (e) {
    console.error("Seed demo newsletter_sends:", e);
  }

  try {
    // 7. Contact submissions
    const contactSnap = await adminDb.collection("contact_submissions").limit(1).get();
    if (contactSnap.empty) {
      await adminDb.collection("contact_submissions").add({
        name: "Demo Visitor",
        email: "visitor@example.com",
        subject: "Partnership inquiry",
        message: "Hi, I would like to know more about your initiatives. Can we schedule a call?",
        read: false,
        created_at: new Date(),
      });
      await adminDb.collection("contact_submissions").add({
        name: "Another User",
        email: "user@example.com",
        subject: null,
        message: "Great work! Keep it up.",
        read: true,
        created_at: new Date(),
      });
    }
  } catch (e) {
    console.error("Seed demo contact_submissions:", e);
  }

  try {
    // 8. Media assets (demo image/video URLs - Cloudinary)
    const assetsSnap = await adminDb.collection("media_assets").limit(1).get();
    if (assetsSnap.empty) {
      const assets = [
        { url: "https://res.cloudinary.com/dpuhlmcth/image/upload/v1753466891/DSC1803-scaled_enhcsi.jpg", type: "image", title: "Community event", alt: "Children at event", category: "Events", show_on_home: true, sort_order: 0, created_at: new Date() },
        { url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample", type: "image", title: "Education initiative", alt: "Library donation", category: "Education", show_on_home: true, sort_order: 1, created_at: new Date() },
        { url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample", type: "image", title: "Our story", alt: "Community and impact", category: "About", show_on_home: false, sort_order: 2, created_at: new Date() },
      ];
      for (const a of assets) {
        await adminDb.collection("media_assets").add(a);
      }
    }
  } catch (e) {
    console.error("Seed demo media_assets:", e);
  }

  try {
    // 9. Projects
    const projSnap = await adminDb.collection("projects").limit(1).get();
    if (projSnap.empty) {
      const projects = [
        { title: "Education for Every Child", description: "We provide scholarships, mentorship, and school supplies to children from underserved communities.", location: "Sonipat & Nearby Villages", budget: "₹2,00,000", status: "Ongoing", progress: 85, sort_order: 1, created_at: new Date() },
        { title: "Health & Hygiene Camps", description: "Our student volunteers organize health checkups, awareness drives, and distribute hygiene kits.", location: "Sonipat, Haryana", budget: "₹1,20,000", status: "Seasonal", progress: 60, sort_order: 2, created_at: new Date() },
        { title: "Community Empowerment", description: "We empower women and youth through skill-building workshops and leadership training.", location: "Rishihood University & Partner Communities", budget: "₹80,000", status: "Ongoing", progress: 70, sort_order: 3, created_at: new Date() },
        { title: "Youth Leadership Incubator", description: "Our flagship program develops the next generation of changemakers.", location: "Rishihood University Campus", budget: "₹50,000", status: "Annual", progress: 90, sort_order: 4, created_at: new Date() },
        { title: "Green India Initiative", description: "From tree plantation drives to clean-up campaigns, we inspire environmental stewardship.", location: "Sonipat & Surroundings", budget: "₹30,000", status: "Ongoing", progress: 40, sort_order: 5, created_at: new Date() },
      ];
      for (const p of projects) {
        await adminDb.collection("projects").add(p);
      }
    }
  } catch (e) {
    console.error("Seed demo projects:", e);
  }

  try {
    // 10. Partners (logos from media_assets URLs - use Cloudinary sample)
    const partSnap = await adminDb.collection("partners").limit(1).get();
    if (partSnap.empty) {
      const partners = [
        { name: "Partner One", logo_url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample", sort_order: 1, created_at: new Date() },
        { name: "Partner Two", logo_url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample", sort_order: 2, created_at: new Date() },
        { name: "Partner Three", logo_url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample", sort_order: 3, created_at: new Date() },
      ];
      for (const p of partners) {
        await adminDb.collection("partners").add(p);
      }
    }
  } catch (e) {
    console.error("Seed demo partners:", e);
  }

  try {
    // 11. Blog posts
    const blogSnap = await adminDb.collection("blog_posts").limit(1).get();
    if (blogSnap.empty) {
      const blogs = [
        { title: "How Student Volunteers Are Changing Lives", excerpt: "Discover the inspiring stories of youth-led change in Sonipat and beyond.", image_url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample", url: "#", sort_order: 1, created_at: new Date() },
        { title: "A Day in the Life: Our Health Camp", excerpt: "Behind the scenes of our latest health and hygiene drive.", image_url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample", url: "#", sort_order: 2, created_at: new Date() },
        { title: "Why Giving Back Matters", excerpt: "The philosophy and impact of student-powered compassion.", image_url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample", url: "#", sort_order: 3, created_at: new Date() },
      ];
      for (const b of blogs) {
        await adminDb.collection("blog_posts").add(b);
      }
    }
  } catch (e) {
    console.error("Seed demo blog_posts:", e);
  }

  try {
    // 12. Press mentions
    const pressSnap = await adminDb.collection("press_mentions").limit(1).get();
    if (pressSnap.empty) {
      const press = [
        { title: "Local Students Launch Community NGO", source: "Sonipat Times", date: "Jan 2024", url: "#", sort_order: 1, created_at: new Date() },
        { title: "Youth Drive Green India Initiative", source: "Haryana Herald", date: "Feb 2024", url: "#", sort_order: 2, created_at: new Date() },
      ];
      for (const p of press) {
        await adminDb.collection("press_mentions").add(p);
      }
    }
  } catch (e) {
    console.error("Seed demo press_mentions:", e);
  }

  try {
    // 13. Works & Events (date, image, full description)
    const worksSnap = await adminDb.collection("works").limit(1).get();
    if (worksSnap.empty) {
      const sampleImage = "https://res.cloudinary.com/dpuhlmcth/image/upload/v1753466891/DSC1803-scaled_enhcsi.jpg";
      const works = [
        {
          title: "Community Health Camp",
          date: new Date("2024-03-15"),
          image_url: sampleImage,
          location: "Sonipat, Haryana",
          description: "We organized a day-long health camp in partnership with local health workers. Over 200 community members received free check-ups, blood pressure screening, and basic health advice. Student volunteers helped with registration, guiding attendees, and distributing hygiene kits. The event strengthened our ties with the community and highlighted the need for regular health awareness drives.",
          sort_order: 1,
          created_at: new Date(),
        },
        {
          title: "Book Donation Drive – Read India Library",
          date: new Date("2024-02-20"),
          image_url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample",
          location: "Read India Library, Sonipat",
          description: "Our team collected and donated over 500 books to support the Read India Library initiative. The drive included storybooks, textbooks, and reference materials for children and young adults. We also spent the day organizing the shelves and reading with the kids. The library staff expressed deep gratitude, and we plan to make this a quarterly event.",
          sort_order: 2,
          created_at: new Date(),
        },
        {
          title: "Diwali Celebration with Community",
          date: new Date("2023-11-12"),
          image_url: "https://res.cloudinary.com/dpuhlmcth/image/upload/sample",
          location: "Rishihood University & nearby villages",
          description: "We celebrated Diwali with underprivileged families and children. The event included distribution of sweets, clothes, and diyas. Student volunteers performed skits on the significance of the festival and led rangoli and craft activities. The joy on the children's faces reminded us why we do what we do—spreading light and hope in every small way we can.",
          sort_order: 3,
          created_at: new Date(),
        },
        {
          title: "Youth Leadership Workshop",
          date: new Date("2024-01-08"),
          image_url: sampleImage,
          location: "Rishihood University Campus",
          description: "A one-day workshop on leadership, communication, and teamwork for 50+ students. Sessions included goal-setting, public speaking practice, and group activities. External mentors from the industry joined to share their journeys. Feedback was overwhelmingly positive, and many participants expressed interest in taking up volunteer roles in our upcoming initiatives.",
          sort_order: 4,
          created_at: new Date(),
        },
      ];
      for (const w of works) {
        await adminDb.collection("works").add(w);
      }
    }
  } catch (e) {
    console.error("Seed demo works:", e);
  }

  return NextResponse.json({
    ok: true,
    message: "Demo data seeded. Collections filled only if they were empty.",
  });
}
