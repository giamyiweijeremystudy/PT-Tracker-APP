/**
 * purge-sft-screenshots — Supabase Edge Function (cron)
 * Deletes SFT screenshots older than 21 days.
 * sft_screenshot_url stores the full public URL.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 21);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const { data: stale, error: fetchErr } = await supabase
      .from("team_submissions")
      .select("id, sft_screenshot_url")
      .not("sft_screenshot_url", "is", null)
      .lt("submission_date", cutoffStr);

    if (fetchErr) throw fetchErr;
    if (!stale || stale.length === 0) {
      return new Response(JSON.stringify({ ok: true, purged: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract storage path from public URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/sft-screenshots/PATH
    const storagePaths = stale
      .map((s: any) => {
        try {
          const match = s.sft_screenshot_url?.match(/\/sft-screenshots\/(.+)/);
          return match ? match[1] : null;
        } catch { return null; }
      })
      .filter(Boolean) as string[];

    if (storagePaths.length > 0) {
      const { error: storageErr } = await supabase.storage
        .from("sft-screenshots")
        .remove(storagePaths);
      if (storageErr) console.error("Storage delete error:", storageErr);
    }

    const ids = stale.map((s: any) => s.id);
    await supabase.from("team_submissions").update({ sft_screenshot_url: null }).in("id", ids);

    return new Response(JSON.stringify({ ok: true, purged: stale.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("purge-sft-screenshots error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
