import type { Context, Config } from "@netlify/functions";

interface ManualTriggerRequest {
  secretCode: string;
}

interface ManualTriggerResponse {
  success: boolean;
  message?: string;
  error?: string;
  requestId?: string;
}

export default async (req: Request, context: Context): Promise<Response> => {
  const requestId = crypto.randomUUID();

  try {
    console.log(`[${requestId}] Manual email polling trigger request received`);

    if (req.method !== "POST") {
      console.warn(`[${requestId}] Invalid method: ${req.method}`);
      return createErrorResponse(
        "Method not allowed. Only POST requests are accepted.",
        405,
        requestId
      );
    }

    let body: ManualTriggerRequest;
    try {
      body = await req.json();
      console.log(`[${requestId}] Request body parsed successfully`);
    } catch (error) {
      console.error(`[${requestId}] Failed to parse request body:`, error);
      return createErrorResponse(
        "Invalid JSON in request body",
        400,
        requestId
      );
    }

    const validationError = validateSecretCode(body.secretCode, requestId);
    if (validationError) {
      return validationError;
    }

    console.log(`[${requestId}] Secret code validated, triggering email polling`);

    const backgroundFunctionUrl = Netlify.env.get("EMAIL_POLLING_BACKGROUND_URL") || "/.netlify/functions/email-polling-background";
    const siteUrl = Netlify.env.get("URL") || Netlify.env.get("DEPLOY_URL");

    if (!siteUrl) {
      console.error(`[${requestId}] Unable to determine site URL`);
      return createErrorResponse(
        "Service configuration error: Unable to determine site URL",
        500,
        requestId
      );
    }

    const fullUrl = `${siteUrl}${backgroundFunctionUrl}`;
    console.log(`[${requestId}] Invoking background function at: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Manual-Request-ID": requestId,
      },
      body: JSON.stringify({ trigger: "manual" }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to invoke background function (${response.status}):`, errorText);
      return createErrorResponse(
        "Failed to trigger email polling job",
        500,
        requestId
      );
    }

    console.log(`[${requestId}] Email polling job triggered successfully`);

    const successResponse: ManualTriggerResponse = {
      success: true,
      message: "Email polling job has been triggered successfully",
      requestId,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 202,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return createErrorResponse(
      "Internal server error occurred",
      500,
      requestId
    );
  }
};

function validateSecretCode(secretCode: string | undefined, requestId: string): Response | null {
  const expectedSecret = Netlify.env.get("EMAIL_POLLING_SECRET");

  if (!expectedSecret) {
    console.error(`[${requestId}] EMAIL_POLLING_SECRET not configured in environment`);
    return createErrorResponse(
      "Service configuration error: Secret not configured",
      500,
      requestId
    );
  }

  if (!secretCode) {
    console.warn(`[${requestId}] Secret code not provided`);
    return createErrorResponse(
      "Secret code is required",
      401,
      requestId
    );
  }

  if (secretCode !== expectedSecret) {
    console.warn(`[${requestId}] Invalid secret code provided`);
    return createErrorResponse(
      "Invalid secret code",
      403,
      requestId
    );
  }

  console.log(`[${requestId}] Secret code validated successfully`);
  return null;
}

function createErrorResponse(message: string, status: number, requestId: string): Response {
  const response: ManualTriggerResponse = {
    success: false,
    error: message,
    requestId,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
  });
}

export const config: Config = {
  path: "/api/email-polling/trigger",
};
