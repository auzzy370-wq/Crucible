/**
 * Transactional mail. Prefer Resend when RESEND_API_KEY is set; otherwise log
 * the message server-side only (never return the body/link to the browser).
 */

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress() {
  return process.env.AUTH_FROM_EMAIL?.trim() || "Crucible <onboarding@resend.dev>";
}

export async function sendMail(message: MailMessage): Promise<{ mode: "resend" | "log" }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html ?? undefined,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend failed (${res.status}): ${detail.slice(0, 200)}`);
    }
    return { mode: "resend" };
  }

  // Local / unpublished fallback: server logs only. Attackers never see the link.
  console.info(
    `[crucible-mail:log] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.text}`,
  );
  return { mode: "log" };
}
