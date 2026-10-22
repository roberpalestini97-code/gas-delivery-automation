"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Payload = {
  conversation: {
    id: number;
    role: string;
    phone: string;
    state: string;
  };
  messages: Array<{
    id: number;
    direction: string;
    body: string;
    createdAt: string;
  }>;
};

export default function ConversacionDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    fetch(`/api/conversations/${params.id}`)
      .then((r) => r.json())
      .then(setData);
  }, [params.id]);

  if (!data?.conversation) {
    return <p className="text-[var(--muted)]">Cargando…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/conversaciones" className="text-sm text-[var(--muted)]">
          ← Conversaciones
        </Link>
        <h2
          className="text-3xl mt-1"
          style={{ fontFamily: "var(--font-brand), sans-serif" }}
        >
          Chat #{data.conversation.id}
        </h2>
        <p className="text-[var(--muted)]">
          {data.conversation.role} · {data.conversation.phone} ·{" "}
          {data.conversation.state}
        </p>
      </div>
      <div className="panel p-4 flex flex-col gap-2 max-h-[70vh] overflow-auto">
        {data.messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble ${m.direction === "inbound" ? "chat-in" : "chat-out"}`}
          >
            <div>{m.body}</div>
            <div className="text-[10px] opacity-60 mt-1">
              {m.createdAt.replace("T", " ").slice(0, 19)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}