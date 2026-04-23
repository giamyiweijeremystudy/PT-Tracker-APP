/**
 * send-notifications — Supabase Edge Function
 * Push notifications only.
 *
 * Required Supabase secrets:
 *   VAPID_PUBLIC_KEY   BB1Thkj8l-qgQpJFtqAwmGDfmDP3uHFsfMmQJctRpzDQqxxdW-PQXdSCDSZ9uL1xSae0nogOBmex6IFW1mwlKLo
 *   VAPID_PRIVATE_KEY  BCPooE0onTFsG7ARhPZBTGPLYL3QgH81gsun2FoNxwE
 *   VAPID_SUBJECT      mailto:pt-app-rsaf-57aeti@gmail.com
 *   APP_URL            https://your-app.vercel.app
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Uint8Array.from(
    atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad),
    c => c.charCodeAt(0)
  );
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

function encodeStr(s: string): Uint8Array { return new TextEncoder().encode(s); }

async function makeVapidJwt(audience: string, subject: string, privateKeyB64url: string): Promise<string> {
  const header  = b64urlEncode(encodeStr(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64urlEncode(encodeStr(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: subject,
  })));
  const sigInput = `${header}.${payload}`;

  const rawBytes = b64urlDecode(privateKeyB64url);
  const pkcs8 = concatBytes(
    new Uint8Array([
      0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13,
      0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
      0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
      0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
    ]),
    rawBytes
  );

  const key = await crypto.subtle.importKey(
    "pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, key, encodeStr(sigInput)
  );
  return `${sigInput}.${b64urlEncode(sig)}`;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const saltKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk     = new Uint8Array(await crypto.subtle.sign("HMAC", saltKey, ikm));
  const prkKey  = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const result = new Uint8Array(length);
  let prev = new Uint8Array(0); let offset = 0; let counter = 1;
  while (offset < length) {
    const data = concatBytes(prev, info, new Uint8Array([counter++]));
    const block = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, data));
    result.set(block.slice(0, Math.min(block.length, length - offset)), offset);
    prev = block; offset += block.length;
  }
  return result.slice(0, length);
}

async function encryptPushPayload(plaintext: string, p256dhB64url: string, authB64url: string): Promise<Uint8Array> {
  const plaintextBytes    = encodeStr(plaintext);
  const clientPublicBytes = b64urlDecode(p256dhB64url);
  const authSecret        = b64urlDecode(authB64url);
  const salt              = crypto.getRandomValues(new Uint8Array(16));

  const serverKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublicBytes = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeyPair.publicKey));

  const clientPubKey = await crypto.subtle.importKey("raw", clientPublicBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientPubKey }, serverKeyPair.privateKey, 256));

  const prkInfo = concatBytes(encodeStr("WebPush: info\x00"), clientPublicBytes, serverPublicBytes);
  const prk     = await hkdf(authSecret, sharedSecret, prkInfo, 32);
  const cek     = await hkdf(salt, prk, encodeStr("Content-Encoding: aes128gcm\x00"), 16);
  const nonce   = await hkdf(salt, prk, encodeStr("Content-Encoding: nonce\x00"), 12);

  const aesKey     = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const padded     = concatBytes(plaintextBytes, new Uint8Array([0x02]));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded));

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  return concatBytes(salt, rs, new Uint8Array([serverPublicBytes.length]), serverPublicBytes, ciphertext);
}

async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payloadJson: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<{ ok: boolean; status?: number }> {
  try {
    const body     = await encryptPushPayload(payloadJson, sub.p256dh, sub.auth);
    const audience = new URL(sub.endpoint).origin;
    const jwt      = await makeVapidJwt(audience, vapidSubject, vapidPrivateKey);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Type":     "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Authorization":    `vapid t=${jwt},k=${vapidPublicKey}`,
        "TTL":              "86400",
      },
      body,
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    console.error("Push send error:", e);
    return { ok: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const { user_id, title, body, url = "/schedule" } = await req.json();
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields: user_id, title, body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await supabase
      .from("user_settings")
      .select("push_enabled")
      .eq("user_id", user_id)
      .single();

    if (!settings?.push_enabled) {
      return new Response(JSON.stringify({ ok: true, result: "push not enabled for user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:pt-app-rsaf-57aeti@gmail.com";
    const appUrl       = Deno.env.get("APP_URL") || "https://your-app.vercel.app";

    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user_id);

    const pushPayload = JSON.stringify({ title, body, url: `${appUrl}${url}`, icon: "/favicon.ico" });
    const results = await Promise.all(
      (subs || []).map(sub => sendPush(sub, pushPayload, vapidPublic, vapidPrivate, vapidSubject))
    );

    // Clean up expired subscriptions
    const expiredEndpoints = (subs || [])
      .filter((_, i) => results[i]?.status === 410)
      .map(s => s.endpoint);
    if (expiredEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
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
