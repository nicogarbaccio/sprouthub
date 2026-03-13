import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://sprouthub.netlify.app",
  "https://www.sprouthub.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function buildEmailHtml({
  inviterName,
  householdName,
  role,
  appUrl,
}: {
  inviterName: string;
  householdName: string;
  role: string;
  appUrl: string;
}) {
  const roleLabel = role === "admin" ? "an Admin" : "a Member";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to a household on sprouthub</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d5a3a 0%, #4a7c59 100%); padding: 36px 40px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🌱</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.3px;">
                You're Invited!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join the household
                <strong>"${householdName}"</strong> as ${roleLabel} on sprouthub.
              </p>

              <p style="margin: 0 0 28px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                As ${roleLabel.toLowerCase()}, you'll be able to ${
    role === "admin"
      ? "manage household settings, invite others, and collaborate on plant care"
      : "view and care for the household's plants together"
  }.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 4px 0 24px;">
                    <a href="${appUrl}/households"
                       style="display: inline-block; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 36px; border-radius: 12px; letter-spacing: -0.2px;">
                      View Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5; text-align: center;">
                If you don't have a sprouthub account yet, you'll be able to sign up and the invitation will be waiting for you.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 4px; color: #9ca3af; font-size: 12px;">
                Sent by <a href="${appUrl}" style="color: #4a7c59; text-decoration: none; font-weight: 500;">sprouthub</a> &mdash; Plant Care Tracker
              </p>
              <p style="margin: 0; color: #d1d5db; font-size: 11px;">
                You received this email because ${inviterName} invited you to their household.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      });
    }

    const { invitedEmail, householdId, role } = await req.json();

    if (!invitedEmail || !householdId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch inviter profile
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name} ${inviterProfile.last_name}`.trim()
      : "A sprouthub user";

    // Fetch household name
    const { data: household } = await supabase
      .from("households")
      .select("name")
      .eq("id", householdId)
      .single();

    const householdName = household?.name || "a household";

    // Determine app URL from request origin
    const origin = req.headers.get("Origin") || "https://www.sprouthub.app";
    const appUrl = ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "https://www.sprouthub.app";

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "sprouthub <noreply@sprouthub.app>",
        to: [invitedEmail],
        subject: `${inviterName} invited you to "${householdName}" on sprouthub`,
        html: buildEmailHtml({
          inviterName,
          householdName,
          role: role || "member",
          appUrl,
        }),
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: emailResult,
        }),
        {
          status: 502,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(
      `Invitation email sent to ${invitedEmail} for household "${householdName}" by ${inviterName}`
    );

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      }
    );
  }
});
