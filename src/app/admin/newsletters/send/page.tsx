"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SendNewsletterEmail from "@/components/newsletters/SendNewsletterEmail";

export default function AdminNewslettersSendPage() {
  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/newsletters"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to newsletters
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Send newsletter</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Choose a newsletter, set subject and link, then select recipients and send.
        </p>
      </div>
      <SendNewsletterEmail />
    </>
  );
}
