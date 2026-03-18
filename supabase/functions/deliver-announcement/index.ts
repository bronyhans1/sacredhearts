// Deliver announcement to user chats via system account.
// Uses service-role to bypass RLS on matches/messages. Do not call from untrusted clients.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_DISPLAY_NAME = "Team SacredHearts";

type Audience = "all" | "male" | "female";

interface ReqBody {
  title?: string;
  body?: string;
  audience?: Audience;
}

interface DeliveryResult {
  success: boolean;
  recipients_processed: number;
  matches_created: number;
  matches_reused: number;
  messages_inserted: number;
  failures: number;
  error?: string;
  match_insert_errors?: Array<Record<string, unknown>>;
  message_insert_errors?: Array<Record<string, unknown>>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data: unknown, status: number) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body: ReqBody = await req.json().catch(() => ({} as ReqBody));
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const bodyText = typeof body.body === "string" ? body.body.trim() : "";
    const audience = body.audience;

    if (!title || !bodyText || !audience) {
      return json(
        { error: "title, body, and audience are required; audience must be all, male, or female" },
        400
      );
    }
    if (audience !== "all" && audience !== "male" && audience !== "female") {
      return json(
        { error: "audience must be all, male, or female" },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Load system profile
    const { data: systemProfile, error: systemError } = await supabase
      .from("profiles")
      .select("id, full_name, is_system")
      .eq("is_system", true)
      .eq("full_name", SYSTEM_DISPLAY_NAME)
      .maybeSingle();

    if (systemError) {
      return json({ error: `Failed to load system profile: ${systemError.message}` }, 500);
    }
    if (!systemProfile?.id) {
      return json(
        { error: `System profile "${SYSTEM_DISPLAY_NAME}" not found (is_system = true, full_name = "${SYSTEM_DISPLAY_NAME}")` },
        400
      );
    }

    const systemId = systemProfile.id;

    // Fetch recipients safely:
    // - keep DB query simple (avoid chained OR filters that might broaden results)
    // - enforce the full predicate set in code
    const { data: allProfiles, error: recipientsError } = await supabase
      .from("profiles")
      .select("id, gender, is_deactivated, is_system, is_banned");

    if (recipientsError) {
      return json({ error: `Failed to fetch recipients: ${recipientsError.message}` }, 500);
    }

    const list = (allProfiles ?? []).filter((p) => {
      if (!p?.id) return false;
      if (p.id === systemId) return false;
      if (p.is_deactivated === true) return false;
      if (p.is_system === true) return false; // treat null as false
      if (p.is_banned === true) return false; // treat null as not banned
      if (audience === "male") return p.gender === "male";
      if (audience === "female") return p.gender === "female";
      return true; // all
    });

    const result: DeliveryResult = {
      success: true,
      recipients_processed: 0,
      matches_created: 0,
      matches_reused: 0,
      messages_inserted: 0,
      failures: 0,
      match_insert_errors: [],
      message_insert_errors: [],
    };

    for (const user of list) {
      result.recipients_processed += 1;
      try {
        // Find existing match (either direction)
        const { data: existingMatches, error: findErr } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user_a_id.eq.${systemId},user_b_id.eq.${user.id}),and(user_a_id.eq.${user.id},user_b_id.eq.${systemId})`
          )
          .limit(1);

        if (findErr) {
          result.failures += 1;
          continue;
        }

        let matchId: string;
        if (existingMatches?.length) {
          matchId = existingMatches[0].id;
          result.matches_reused += 1;
        } else {
          const { data: created, error: insertMatchErr } = await supabase
            .from("matches")
            .insert({
              user_a_id: systemId,
              user_b_id: user.id,
              status: "mutual",
            })
            .select("id")
            .single();

          if (insertMatchErr || !created?.id) {
            result.failures += 1;
            if ((result.match_insert_errors?.length ?? 0) < 5) {
              result.match_insert_errors?.push({
                user_id: user.id,
                code: insertMatchErr?.code,
                message: insertMatchErr?.message,
                details: insertMatchErr?.details,
                hint: insertMatchErr?.hint,
              });
            }
            continue;
          }
          matchId = created.id;
          result.matches_created += 1;
        }

        // Insert message:
        // Match the app's known-good shape for text messages:
        //   match_id, sender_id, content, read_at: null
        // recipient_id is NOT used (it does not exist in your schema cache).
        // Optional fallback: if a type column exists/required, retry with type: 'text'.
        const basePayload: Record<string, unknown> = {
          match_id: matchId,
          sender_id: systemId,
          content: bodyText,
          read_at: null,
        };

        // Attempt #1: base payload (no recipient_id, no type)
        const attempt1 = await supabase.from("messages").insert(basePayload);
        if (!attempt1.error) {
          result.messages_inserted += 1;
          continue;
        }

        // Attempt #2: retry with type if it exists/required (undefined_column-safe)
        const attempt2 = await supabase.from("messages").insert({ ...basePayload, type: "text" });
        if (!attempt2.error) {
          result.messages_inserted += 1;
          continue;
        }

        result.failures += 1;
        if ((result.message_insert_errors?.length ?? 0) < 5) {
          result.message_insert_errors?.push({
            user_id: user.id,
            match_id: matchId,
            attempts: [
              { code: attempt1.error?.code, message: attempt1.error?.message, details: attempt1.error?.details, hint: attempt1.error?.hint },
              { code: attempt2.error?.code, message: attempt2.error?.message, details: attempt2.error?.details, hint: attempt2.error?.hint },
            ],
          });
        }
      } catch {
        result.failures += 1;
      }
    }

    // Keep response small if empty
    if ((result.match_insert_errors?.length ?? 0) === 0) delete result.match_insert_errors;
    if ((result.message_insert_errors?.length ?? 0) === 0) delete result.message_insert_errors;

    return json(result, 200);
  } catch (e) {
    return json(
      { success: false, error: e instanceof Error ? e.message : "deliver-announcement failed" },
      500
    );
  }
});
