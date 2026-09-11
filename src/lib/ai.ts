import { createServerFn } from "@tanstack/react-start";
import { POLICY_CONTEXT } from "./policies";

type ChatTurn = { role: "user" | "assistant"; content: string };

async function complete(system: string, user: string, maxTokens: number) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: "unavailable" as const };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) return { ok: false as const, error: `api-${res.status}` as const };
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  return { ok: true as const, text: body.choices[0]?.message.content?.trim() ?? "" };
}

export const askHrBot = createServerFn({ method: "POST" })
  .validator((input: { messages: ChatTurn[]; context: string }) => input)
  .handler(async ({ data }) => {
    const history = data.messages
      .slice(-8)
      .map((m) => `${m.role === "user" ? "Karyawan" : "Asisten"}: ${m.content}`)
      .join("\n");
    const system = `Kamu asisten People PT Arunika Digital. Jawab ringkas, hangat, dan akurat dalam bahasa Indonesia. Jangan mengarang kebijakan. Jika tidak ada di konteks, katakan harus ditanyakan ke People Partner. Jangan menampilkan gaji orang lain.
${POLICY_CONTEXT}
Konteks karyawan saat ini:
${data.context}`;
    return complete(system, history || "Halo", 420);
  });

export const generateReview = createServerFn({ method: "POST" })
  .validator(
    (input: {
      name: string;
      title: string;
      kpis: string;
      reviews: string;
      attendance: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const system =
      "Kamu menulis draf penilaian kinerja manajer dalam bahasa Indonesia. Nada tenang, spesifik, objektif. Struktur: ringkasan, bukti (KPI & perilaku), kekuatan, area tumbuh, usulan 90 hari. Jangan memuji kosong. Jangan mengarang angka. Maksimal 280 kata.";
    const user = `Karyawan: ${data.name}, ${data.title}
KPI:\n${data.kpis}
Umpan balik yang ada:\n${data.reviews}
Kehadiran:\n${data.attendance}`;
    return complete(system, user, 700);
  });

export const matchInternal = createServerFn({ method: "POST" })
  .validator(
    (input: {
      position: string;
      requirements: string;
      candidates: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const system =
      "Kamu mitra talent internal. Cocokkan karyawan lama ke posisi terbuka. Bahasa Indonesia. Kembalikan 3–5 nama terurut, masing-masing: kecocokan (tinggi/sedang/rendah), alasan 1 kalimat, risiko 1 kalimat. Hanya dari daftar kandidat. Jangan mengada-ada keterampilan.";
    const user = `Posisi: ${data.position}
Kebutuhan: ${data.requirements}
Kandidat:\n${data.candidates}`;
    return complete(system, user, 520);
  });

export const analyzeRetention = createServerFn({ method: "POST" })
  .validator((input: { snapshot: string }) => input)
  .handler(async ({ data }) => {
    const system =
      "Kamu analis people analytics. Bahasa Indonesia, nada tenang. Dari data kehadiran, KPI, dan survei, identifikasi risiko burnout/turnover. Untuk tiap orang berisiko: sinyal, hipotesis, tindakan 2 minggu ke depan. Jangan menstigma. Jangan mengarang data.";
    return complete(system, data.snapshot, 640);
  });
