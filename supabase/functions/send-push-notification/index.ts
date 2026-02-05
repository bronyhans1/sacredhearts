// Send Web Push to a recipient using subscription stored in push_tokens.
// Uses @negrel/webpush (Deno-compatible). Set secret VAPID_KEYS_JSON in Supabase.

import { createClient } from "jsr:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReqBody {
  recipient_id?: string;
  title?: string;
  body?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipient_id, title, body }: ReqBody = await req.json();
    if (!recipient_id) {
      return new Response(
        JSON.stringify({ error: "recipient_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vapidKeysJson = Deno.env.get("VAPID_KEYS_JSON");
    if (!vapidKeysJson) {
      return new Response(
        JSON.stringify({ error: "VAPID_KEYS_JSON secret not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: rows, error: fetchError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", recipient_id)
      .eq("platform", "web")
      .limit(1);

    if (fetchError || !rows?.length) {
      return new Response(
        JSON.stringify({ ok: false, reason: "no subscription" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raw = rows[0].token;
    let subscription: webpush.PushSubscription;
    try {
      subscription = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return new Response(
        JSON.stringify({ error: "invalid subscription in DB" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return new Response(
        JSON.stringify({ ok: false, reason: "invalid subscription shape" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vapidKeys = await webpush.importVapidKeys(JSON.parse(vapidKeysJson), {
      extractable: false,
    });
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: "mailto:support@yourapp.com",
      vapidKeys,
    });

    const subscriber = appServer.subscribe(subscription);
    const payload = JSON.stringify({ title: title ?? "New notification", body: body ?? "" });
    await subscriber.pushTextMessage(payload, { urgency: webpush.Urgency.High });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "send failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
