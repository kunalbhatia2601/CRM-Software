"use client";

import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

export function MessageBubble({ message }) {
  const router = useRouter();
  const isUser = message.role === "user";

  // Get structured data from message
  const action = message.action;
  const structuredEntities = message.entities || [];

  // Parse content for entity links in the text
  const parseContent = (content) => {
    if (!content) return [];

    // Strip HTML tags that AI sometimes adds
    let cleanContent = content.replace(/<[^>]*>/g, "").trim();

    // Pattern: [EntityName](entityType:entityId)
    const entityPattern = /\[([^\]]+)\]\(([a-z]+):([a-zA-Z0-9_-]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = entityPattern.exec(cleanContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: cleanContent.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: "entity",
        name: match[1],
        entityType: match[2],
        entityId: match[3],
      });
      lastIndex = entityPattern.lastIndex;
    }

    if (lastIndex < cleanContent.length) {
      parts.push({
        type: "text",
        content: cleanContent.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: cleanContent }];
  };

  const contentParts = parseContent(message.content);

  // Combine text-parsed entities with structured entities
  const allEntities = [...structuredEntities];

  const handleEntityClick = (entity) => {
    const routes = {
      lead: `/owner/leads/${entity.entityId}`,
      deal: `/owner/deals/${entity.entityId}`,
      client: `/owner/clients/${entity.entityId}`,
      project: `/owner/projects/${entity.entityId}`,
      task: `/owner/tasks/${entity.entityId}`,
      meeting: `/owner/meetings/${entity.entityId}`,
      team: `/owner/teams/${entity.entityId}`,
    };

    const route = routes[entity.entityType];
    if (route) {
      router.push(route);
    }
  };

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {isUser ? (
        <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
          {message.authorInitials || "You"}
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5542F6] to-[#4636d4] flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
            isUser
              ? "bg-indigo-500 text-white rounded-tr-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-md"
          }`}
        >
          {contentParts.map((part, index) => {
            if (part.type === "entity") {
              return (
                <button
                  key={index}
                  onClick={() => handleEntityClick(part)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    isUser
                      ? "bg-indigo-400/50 text-white hover:bg-indigo-400"
                      : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900"
                  }`}
                >
                  <MessageCircle className="w-3 h-3" />
                  {part.name}
                </button>
              );
            }
            return <span key={index}>{part.content}</span>;
          })}
        </div>

        {/* Timestamp */}
        <span
          className={`text-[10px] text-slate-400 dark:text-slate-500 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}