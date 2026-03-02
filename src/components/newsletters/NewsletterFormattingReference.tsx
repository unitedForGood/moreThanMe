"use client";

import { FileText } from "lucide-react";

const REFERENCE_ITEMS = [
  { syntax: "**text**", effect: "Bold", example: "**Donate now** → Donate now" },
  { syntax: "*text*", effect: "Italic", example: "*Thank you* → Thank you" },
  { syntax: "~~text~~", effect: "Strikethrough", example: "~~₹500~~ ₹400 → old price crossed" },
  { syntax: "`text`", effect: "Inline code", example: "`17th March` → date or label" },
  { syntax: "==text==", effect: "Highlight", example: "==Key date== → yellow highlight" },
  { syntax: "- item", effect: "Bullet list", example: "Start line with - or *" },
  { syntax: "1. item", effect: "Numbered list", example: "1. First 2. Second" },
  { syntax: "[text](url)", effect: "Link", example: "[Visit us](https://morethanme.in)" },
  { syntax: "# Heading", effect: "Large heading", example: "# Main section" },
  { syntax: "## Subheading", effect: "Medium heading", example: "## Sub-section" },
  { syntax: "### Small heading", effect: "Small heading", example: "### Minor section" },
  { syntax: "> quote", effect: "Blockquote", example: "> Short testimonial or callout" },
  { syntax: "--- or ***", effect: "Horizontal rule", example: "Visual separator between sections" },
] as const;

export default function NewsletterFormattingReference() {
  return (
    <div className="mt-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/50 flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary-600" aria-hidden />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Formatting reference
        </h3>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
              <th className="pb-2 pr-4 font-medium">Syntax</th>
              <th className="pb-2 pr-4 font-medium">Effect</th>
              <th className="pb-2 font-medium">Example</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-gray-300">
            {REFERENCE_ITEMS.map((row) => (
              <tr
                key={row.syntax}
                className="border-b border-gray-100 dark:border-gray-700/70 last:border-0"
              >
                <td className="py-2 pr-4 align-top">
                  <code className="text-xs bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 whitespace-nowrap">
                    {row.syntax}
                  </code>
                </td>
                <td className="py-2 pr-4 align-top font-medium">{row.effect}</td>
                <td className="py-2 align-top text-gray-600 dark:text-gray-400">
                  {row.example}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
