/**
 * notify-daily-schedule — Supabase Edge Function (cron)
 *
 * Runs daily at 07:00 SGT (23:00 UTC previous day).
 * Finds all personal_events for today, checks which users
 * have notifications enabled, and dispatches push + email.
 *
 * Schedule in supabase/config.toml:
 *   [functions.notify-daily-schedule]
 *   schedule = "0 23 * * *"   # 23:00 UTC = 07:00 SGT (UTC+8)
 *
 * Or via Supabase Dashboard → Edge Functions → Schedule.
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

  // Today's date in SGT (UTC+8)
  const now    = new Date();
  const sgtNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const todayStr = sgtNow.toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    // Fetch all personal events for today
    const { data: events, error: eventsError } = await supabase
      .from("personal_events")
      .select("user_id, title, description, event_type")
      .eq("event_date", todayStr)
      .eq("source", "personal");

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "No events today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group events by user_id
    const byUser = new Map<string, typeof events>();
    for (const evt of events) {
      if (!byUser.has(evt.user_id)) byUser.set(evt.user_id, []);
      byUser.get(evt.user_id)!.push(evt);
    }

    // Fetch user settings for these users (only those with notifications on)
    const userIds = [...byUser.keys()];
    const { data: settings } = await supabase
      .from("user_settings")
      .select("user_id, push_enabled, email_notifications")
      .in("user_id", userIds)
      .or("push_enabled.eq.true,email_notifications.eq.true");

    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "No users with notifications enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appUrl = Deno.env.get("APP_URL") || "https://your-app.vercel.app";
    let sent = 0;

    for (const userSetting of settings) {
      const userEvents = byUser.get(userSetting.user_id) ?? [];
      if (userEvents.length === 0) continue;

      const channels: string[] = [];
      if (userSetting.push_enabled)         channels.push("push");
      if (userSetting.email_notifications)  channels.push("email");
      if (channels.length === 0) continue;

      // Build a combined message if multiple events
      const typeEmoji: Record<string, string> = { PT: "🪖", SFT: "🏃", Personal: "📌", Other: "📅" };
      let title: string;
      let body: string;

      if (userEvents.length === 1) {
        const e = userEvents[0];
        const emoji = typeEmoji[e.event_type] ?? "📅";
        title = `${emoji} Today: ${e.title}`;
        body  = e.description?.trim()
          ? e.description.trim()
          : `You have a ${e.event_type} event scheduled for today.`;
      } else {
        title = `📅 You have ${userEvents.length} events today`;
        body  = userEvents.map(e => `${typeEmoji[e.event_type] ?? "•"} ${e.title}`).join("\n");
      }

      // Reuse send-notifications function
      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notifications`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          user_id: userSetting.user_id,
          title,
          body,
          url: "/schedule",
          channels,
        }),
      });

      if (res.ok) sent++;
    }

    return new Response(JSON.stringify({ ok: true, sent, total_users: settings.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("notify-daily-schedule error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
