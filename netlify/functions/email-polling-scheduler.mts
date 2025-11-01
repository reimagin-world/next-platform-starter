import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const requestId = crypto.randomUUID();
  
  try {
    const { next_run } = await req.json();
    console.log(`[${requestId}] Email polling scheduler triggered. Next run at: ${next_run}`);

    const backgroundFunctionUrl = Netlify.env.get("EMAIL_POLLING_BACKGROUND_URL") || "/.netlify/functions/email-polling-background";
    const siteUrl = Netlify.env.get("URL") || Netlify.env.get("DEPLOY_URL");

    if (!siteUrl) {
      console.error(`[${requestId}] Unable to determine site URL for invoking background function`);
      return;
    }

    const fullUrl = `${siteUrl}${backgroundFunctionUrl}`;
    console.log(`[${requestId}] Invoking background function at: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Scheduler-Request-ID": requestId,
      },
      body: JSON.stringify({ trigger: "scheduled" }),
    });

    if (response.ok) {
      console.log(`[${requestId}] Background function invoked successfully (status: ${response.status})`);
    } else {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to invoke background function (${response.status}):`, errorText);
    }
  } catch (error) {
    console.error(`[${requestId}] Error in email polling scheduler:`, error);
  }
};

export const config: Config = {
  schedule: Netlify.env.get("EMAIL_POLLING_SCHEDULE") || "@hourly",
};
