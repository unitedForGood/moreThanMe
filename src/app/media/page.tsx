"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

type BlogPost = { title: string; excerpt: string; image_url: string; url: string };
type PressItem = { title: string; source: string; date: string; url: string };
type MediaAsset = { url: string; alt?: string; title?: string; category?: string };

function FilterableGallery({ photos }: { photos: MediaAsset[] }) {
  const [selected, setSelected] = useState("All");
  const categories = ["All", ...Array.from(new Set(photos.map((p) => p.category || "General")))];
  const filtered = selected === "All" ? photos : photos.filter((p) => (p.category || "General") === selected);

  return (
    <div>
      <div className="flex justify-center gap-4 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`px-5 py-2 rounded-full font-semibold border transition-colors duration-200 ${selected === cat ? "bg-primary text-white border-primary" : "bg-white dark:bg-gray-800 text-primary border-primary hover:bg-primary hover:text-white"}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {filtered.map((photo, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg group">
            <Image
              src={photo.url}
              alt={photo.alt || photo.title || "Gallery"}
              width={400}
              height={270}
              className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-90"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {photo.alt || photo.title || "Gallery"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MediaPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [press, setPress] = useState<PressItem[]>([]);
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [featuredVideoUrl, setFeaturedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blog-posts").then((r) => r.json()).then((d) => Array.isArray(d) && setBlogs(d)).catch(() => {});
  }, []);
  useEffect(() => {
    fetch("/api/press").then((r) => r.json()).then((d) => Array.isArray(d) && setPress(d)).catch(() => {});
  }, []);
  useEffect(() => {
    fetch("/api/gallery/all")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setPhotos(d.map((p: { src: string; alt: string; category?: string }) => ({ url: p.src, alt: p.alt, title: p.alt, category: p.category || "General" })));
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.hero_image_url) setHeroUrl(s.hero_image_url);
        if (s.featured_video_url) setFeaturedVideoUrl(s.featured_video_url);
      })
      .catch(() => {});
  }, []);

  const heroBg = heroUrl || (photos.length > 0 ? photos[0].url : null);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative w-full min-h-[40vh] flex items-center justify-center bg-gradient-to-br from-blue-100 to-white dark:from-blue-950 dark:to-gray-950 rounded-3xl shadow-lg my-12 overflow-hidden">
        {heroBg && (
          <Image
            src={heroBg}
            alt="Media Hero"
            fill
            className="object-cover object-center opacity-60"
            style={{ zIndex: 1 }}
          />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16 w-full max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary mb-4 drop-shadow-lg">
            Media & Stories
          </h1>
          <p className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 mb-6 font-medium drop-shadow">
            Explore our journey through photos, videos, blogs, and news. See how student-powered compassion is making headlines and inspiring change.
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="w-full max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-primary">Photo Gallery</h2>
        {photos.length > 0 ? (
          <FilterableGallery photos={photos} />
        ) : (
          <p className="text-center text-neutral-500 py-12">No gallery images yet. Add media in the admin panel.</p>
        )}
      </section>

      {/* Video Section - only if featured_video_url is set */}
      {featuredVideoUrl && (
        <section className="w-full max-w-4xl mx-auto py-16 px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">Featured Video</h2>
          <div className="aspect-w-16 aspect-h-9 w-full rounded-2xl overflow-hidden shadow-xl mx-auto mb-6 bg-black">
            <iframe
              src={featuredVideoUrl}
              title="NGO Introduction Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Watch our story and see the impact of student-driven service in action.</p>
        </section>
      )}

      {/* Blog Highlights */}
      <section className="w-full max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-primary">From Our Blog</h2>
        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link href={blog.url} key={blog.title} className="group rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 hover:shadow-2xl transition">
                <div className="relative h-48 w-full">
                  <Image src={blog.image_url} alt={blog.title} fill className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-primary group-hover:underline">{blog.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{blog.excerpt}</p>
                  <span className="text-sm text-blue-600 group-hover:underline">Read More →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-neutral-500 py-8">No blog posts yet. Add content in the admin panel.</p>
        )}
      </section>

      {/* Press/News Mentions */}
      <section className="w-full max-w-4xl mx-auto py-16 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary text-center">In the News</h2>
        {press.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {press.map((item) => (
              <a
                href={item.url}
                key={item.title}
                className="block rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 hover:shadow-2xl transition border-l-4 border-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <h3 className="text-lg font-bold mb-2 text-primary">{item.title}</h3>
                <div className="text-gray-600 dark:text-gray-300 mb-1">{item.source}</div>
                <div className="text-xs text-gray-400">{item.date}</div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-center text-neutral-500 py-8">No press mentions yet. Add content in the admin panel.</p>
        )}
      </section>

      {/* Call to Action */}
      <section className="w-full bg-blue-700 dark:bg-blue-900 text-white py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Share Your Story or Connect With Us</h2>
        <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto">
          Do you have a story to share, want to feature us, or have a media inquiry? Reach out and help us spread the spirit of giving back!
        </p>
        <Link href="/contact">
          <button className="bg-white text-blue-700 font-bold px-10 py-5 rounded-full shadow-xl hover:bg-gray-100 transition transform hover:scale-105 active:scale-95 duration-200">Contact Media Team</button>
        </Link>
      </section>
    </main>
  );
}
