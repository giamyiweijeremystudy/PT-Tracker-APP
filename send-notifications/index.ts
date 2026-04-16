/**
 * send-notifications — Supabase Edge Function
 *
 * Called by the frontend (or a pg_cron job) to dispatch:
 *   - Email reminders via Resend
 *   - Web Push notifications to all saved subscriptions
 *
 * Expected request body:
 * {
 *   user_id:   string,
 *   title:     string,
 *   body:      string,
 *   url?:      string,   // deep-link inside the app (default "/schedule")
 *   channels?: ('email' | 'push')[]  // default: both
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Web Push helpers (using the web-push-libraries compatible approach) ────────
// We use the VAPID keys stored as env vars and sign manually via SubtleCrypto.

async function importVapidKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  return await crypto.subtle.importKey("raw", raw, { name: "ECDH", namedCurve: "P-256" }, true, []);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function buildVapidToken(audience: string, subject: string, privateKeyB64: string): Promise<string> {
  const header  = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })));
  const sigInput = `${header}.${payload}`;

  const rawKey = Uint8Array.from(atob(privateKeyB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", rawKey,
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(sigInput));
  return `${sigInput}.${base64UrlEncode(sig)}`;
}

async function sendPushNotification(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<{ ok: boolean; status?: number }> {
  try {
    const audience = new URL(sub.endpoint).origin;
    const token    = await buildVapidToken(audience, vapidSubject, vapidPrivateKey);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Type":  "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Authorization": `vapid t=${token},k=${vapidPublicKey}`,
        "TTL": "86400",
      },
      body: new TextEncoder().encode(payload),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    console.error("Push send error:", e);
    return { ok: false };
  }
}

// ── Email via Resend ──────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string, resendKey: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    "PT App <noreply@yourdomain.com>",  // ← update to your verified Resend domain
      to:      [to],
      subject,
      html,
    }),
  });
  return res.ok;
}

function buildEmailHtml(title: string, body: string, url: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
    <div style="font-size:28px;margin-bottom:8px;">🗓️</div>
    <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">${title}</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">${body}</p>
    <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;">
      Open PT App
    </a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
      You're receiving this because you enabled schedule reminders in PT App settings.
    </p>
  </div>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { user_id, title, body, url = "/schedule", channels = ["email", "push"] } = await req.json();
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load user settings + auth user email
    const [settingsRes, authRes] = await Promise.all([
      supabase.from("user_settings").select("*").eq("user_id", user_id).single(),
      supabase.auth.admin.getUserById(user_id),
    ]);

    const settings = settingsRes.data;
    const appUrl   = Deno.env.get("APP_URL") || "https://your-app.vercel.app";
    const fullUrl  = `${appUrl}${url}`;
    const results: Record<string, unknown> = {};

    // ── Email ────────────────────────────────────────────────────────────────
    if (channels.includes("email") && settings?.email_notifications) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const email = settings.notification_email || authRes.data?.user?.email;
        if (email) {
          results.email = await sendEmail(email, title, buildEmailHtml(title, body, fullUrl), resendKey);
        }
      } else {
        console.warn("RESEND_API_KEY not set — skipping email");
        results.email = "skipped (no API key)";
      }
    }

    // ── Push ─────────────────────────────────────────────────────────────────
    if (channels.includes("push") && settings?.push_enabled) {
      const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY");
      const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
      const vapidSubject = Deno.env.get("VAPID_SUBJECT") || `mailto:admin@yourdomain.com`;

      if (vapidPublic && vapidPrivate) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", user_id);

        const pushPayload = JSON.stringify({ title, body, url: fullUrl, icon: "/favicon.ico" });

        const pushResults = await Promise.all(
          (subs || []).map(sub => sendPushNotification(sub, pushPayload, vapidPublic, vapidPrivate, vapidSubject))
        );

        // Remove expired/invalid subscriptions (410 Gone)
        const expiredEndpoints = (subs || [])
          .filter((_, i) => pushResults[i]?.status === 410)
          .map(s => s.endpoint);

        if (expiredEndpoints.length > 0) {
          await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
        }

        results.push = pushResults;
      } else {
        console.warn("VAPID keys not set — skipping push");
        results.push = "skipped (no VAPID keys)";
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("send-notifications error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
