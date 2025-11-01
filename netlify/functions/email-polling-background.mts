import type { Context } from "@netlify/functions";

interface EmailAttachment {
  filename: string;
  mimeType: string;
  base64Content: string;
  size: number;
}

interface EmailData {
  messageId: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  receivedDate: string;
  attachments: EmailAttachment[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    parts?: Array<{
      partId: string;
      mimeType: string;
      filename: string;
      body: {
        attachmentId?: string;
        size: number;
        data?: string;
      };
      parts?: any[];
    }>;
    body?: {
      size: number;
      data?: string;
    };
  };
  internalDate: string;
}

interface CamundaVariable {
  value: any;
  type: string;
}

interface CamundaProcessInstanceRequest {
  variables: {
    [key: string]: CamundaVariable;
  };
}

interface ProcessedEmailState {
  lastProcessedMessageId: string;
  lastProcessedTimestamp: number;
}

export default async (req: Request, context: Context): Promise<void> => {
  const requestId = crypto.randomUUID();
  
  try {
    console.log(`[${requestId}] Email polling background job started`);

    const validationError = await validateConfiguration(requestId);
    if (validationError) {
      console.error(`[${requestId}] Configuration validation failed: ${validationError}`);
      throw new Error(validationError);
    }

    const { accessToken, refreshToken } = await getGmailAccessToken(requestId);
    
    const newEmails = await fetchNewEmails(accessToken, requestId);
    
    if (newEmails.length === 0) {
      console.log(`[${requestId}] No new emails found`);
      return;
    }

    console.log(`[${requestId}] Processing ${newEmails.length} new email(s)`);

    for (const email of newEmails) {
      try {
        await processEmail(email, accessToken, requestId);
      } catch (error) {
        console.error(`[${requestId}] Failed to process email ${email.id}:`, error);
      }
    }

    console.log(`[${requestId}] Email polling background job completed`);
  } catch (error) {
    console.error(`[${requestId}] Email polling job failed:`, error);
    throw error;
  }
};

async function validateConfiguration(requestId: string): Promise<string | null> {
  const requiredVars = [
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "GMAIL_REFRESH_TOKEN",
    "CAMUNDA_ZEEBE_ADDRESS",
    "CAMUNDA_CLIENT_ID",
    "CAMUNDA_CLIENT_SECRET",
    "CAMUNDA_PROCESS_ID",
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    const value = Netlify.env.get(varName);
    if (!value) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    return `Missing required environment variables: ${missingVars.join(", ")}`;
  }

  console.log(`[${requestId}] Configuration validated successfully`);
  return null;
}

async function getGmailAccessToken(requestId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const clientId = Netlify.env.get("GMAIL_CLIENT_ID")!;
  const clientSecret = Netlify.env.get("GMAIL_CLIENT_SECRET")!;
  const refreshToken = Netlify.env.get("GMAIL_REFRESH_TOKEN")!;

  console.log(`[${requestId}] Refreshing Gmail access token`);

  const tokenUrl = "https://oauth2.googleapis.com/token";
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to refresh token (${response.status}):`, errorText);
      throw new Error(`Failed to refresh Gmail access token: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[${requestId}] Gmail access token refreshed successfully`);

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken,
    };
  } catch (error) {
    console.error(`[${requestId}] Error refreshing Gmail access token:`, error);
    throw new Error(`Failed to refresh Gmail access token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function fetchNewEmails(accessToken: string, requestId: string): Promise<GmailMessage[]> {
  const gmailUserId = Netlify.env.get("GMAIL_USER_ID") || "me";
  const maxResults = parseInt(Netlify.env.get("GMAIL_MAX_RESULTS") || "10", 10);
  const queryFilter = Netlify.env.get("GMAIL_QUERY_FILTER") || "is:unread";

  console.log(`[${requestId}] Fetching emails with filter: ${queryFilter}`);

  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/${gmailUserId}/messages?maxResults=${maxResults}&q=${encodeURIComponent(queryFilter)}`;
    
    const listResponse = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error(`[${requestId}] Failed to list emails (${listResponse.status}):`, errorText);
      throw new Error(`Failed to list emails: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    
    if (!listData.messages || listData.messages.length === 0) {
      console.log(`[${requestId}] No messages found matching query`);
      return [];
    }

    console.log(`[${requestId}] Found ${listData.messages.length} message(s)`);

    const messages: GmailMessage[] = [];
    for (const message of listData.messages) {
      const fullMessage = await fetchFullEmail(message.id, accessToken, gmailUserId, requestId);
      if (fullMessage) {
        messages.push(fullMessage);
      }
    }

    return messages;
  } catch (error) {
    console.error(`[${requestId}] Error fetching emails:`, error);
    throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function fetchFullEmail(
  messageId: string,
  accessToken: string,
  userId: string,
  requestId: string
): Promise<GmailMessage | null> {
  try {
    const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${messageId}?format=full`;
    
    const response = await fetch(messageUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to fetch message ${messageId} (${response.status}):`, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[${requestId}] Error fetching message ${messageId}:`, error);
    return null;
  }
}

async function processEmail(message: GmailMessage, accessToken: string, requestId: string): Promise<void> {
  console.log(`[${requestId}] Processing email ${message.id}`);

  const emailData = await extractEmailData(message, accessToken, requestId);
  
  await createCamundaProcessInstance(emailData, requestId);
  
  const shouldMarkAsRead = Netlify.env.get("GMAIL_MARK_AS_READ") === "true";
  if (shouldMarkAsRead) {
    await markEmailAsRead(message.id, accessToken, requestId);
  }

  console.log(`[${requestId}] Email ${message.id} processed successfully`);
}

async function extractEmailData(message: GmailMessage, accessToken: string, requestId: string): Promise<EmailData> {
  const headers = message.payload.headers;
  
  const getHeader = (name: string): string => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : "";
  };

  const parseAddresses = (addressString: string): string[] => {
    if (!addressString) return [];
    return addressString.split(",").map(addr => addr.trim()).filter(addr => addr.length > 0);
  };

  const from = getHeader("From");
  const to = parseAddresses(getHeader("To"));
  const cc = parseAddresses(getHeader("Cc"));
  const subject = getHeader("Subject");
  const date = getHeader("Date");

  let body = "";
  let bodyHtml = "";
  const attachments: EmailAttachment[] = [];

  const extractParts = async (parts: any[] | undefined, isAttachment: boolean = false) => {
    if (!parts) return;

    for (const part of parts) {
      const mimeType = part.mimeType || "";
      const filename = part.filename || "";

      if (part.parts) {
        await extractParts(part.parts, isAttachment);
      } else if (filename && part.body.attachmentId) {
        const attachmentData = await fetchAttachment(
          message.id,
          part.body.attachmentId,
          accessToken,
          Netlify.env.get("GMAIL_USER_ID") || "me",
          requestId
        );

        if (attachmentData) {
          attachments.push({
            filename: filename,
            mimeType: mimeType,
            base64Content: attachmentData,
            size: part.body.size || 0,
          });
        }
      } else if (mimeType === "text/plain" && part.body.data && !body) {
        body = decodeBase64Url(part.body.data);
      } else if (mimeType === "text/html" && part.body.data && !bodyHtml) {
        bodyHtml = decodeBase64Url(part.body.data);
      }
    }
  };

  if (message.payload.parts) {
    await extractParts(message.payload.parts);
  } else if (message.payload.body?.data) {
    body = decodeBase64Url(message.payload.body.data);
  }

  console.log(`[${requestId}] Extracted email: subject="${subject}", attachments=${attachments.length}`);

  return {
    messageId: message.id,
    from,
    to,
    cc,
    subject,
    body: body || bodyHtml,
    bodyHtml: bodyHtml || undefined,
    receivedDate: date,
    attachments,
  };
}

async function fetchAttachment(
  messageId: string,
  attachmentId: string,
  accessToken: string,
  userId: string,
  requestId: string
): Promise<string | null> {
  try {
    const attachmentUrl = `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${messageId}/attachments/${attachmentId}`;
    
    const response = await fetch(attachmentUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to fetch attachment ${attachmentId} (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`[${requestId}] Error fetching attachment ${attachmentId}:`, error);
    return null;
  }
}

function decodeBase64Url(encoded: string): string {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const base64Padded = base64 + padding;
    
    return atob(base64Padded);
  } catch (error) {
    console.error("Error decoding base64url:", error);
    return "";
  }
}

async function createCamundaProcessInstance(emailData: EmailData, requestId: string): Promise<void> {
  const zeebeAddress = Netlify.env.get("CAMUNDA_ZEEBE_ADDRESS")!;
  const clientId = Netlify.env.get("CAMUNDA_CLIENT_ID")!;
  const clientSecret = Netlify.env.get("CAMUNDA_CLIENT_SECRET")!;
  const processId = Netlify.env.get("CAMUNDA_PROCESS_ID")!;
  const oauthUrl = Netlify.env.get("CAMUNDA_OAUTH_URL") || "https://login.cloud.camunda.io/oauth/token";

  console.log(`[${requestId}] Creating Camunda process instance for process: ${processId}`);

  try {
    const accessToken = await getCamundaAccessToken(oauthUrl, clientId, clientSecret, requestId);

    const processVariables: CamundaProcessInstanceRequest = {
      variables: {
        emailMessageId: { value: emailData.messageId, type: "String" },
        emailFrom: { value: emailData.from, type: "String" },
        emailTo: { value: emailData.to, type: "String" },
        emailCc: { value: emailData.cc, type: "String" },
        emailSubject: { value: emailData.subject, type: "String" },
        emailBody: { value: emailData.body, type: "String" },
        emailReceivedDate: { value: emailData.receivedDate, type: "String" },
        attachments: { value: JSON.stringify(emailData.attachments), type: "String" },
        attachmentCount: { value: emailData.attachments.length, type: "Long" },
      },
    };

    const createInstanceUrl = `${zeebeAddress}/v1/process-instances`;

    const response = await fetch(createInstanceUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bpmnProcessId: processId,
        variables: processVariables.variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to create process instance (${response.status}):`, errorText);
      throw new Error(`Failed to create Camunda process instance: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[${requestId}] Process instance created successfully: ${result.processInstanceKey || result.key}`);
  } catch (error) {
    console.error(`[${requestId}] Error creating Camunda process instance:`, error);
    throw new Error(`Failed to create Camunda process instance: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function getCamundaAccessToken(
  oauthUrl: string,
  clientId: string,
  clientSecret: string,
  requestId: string
): Promise<string> {
  console.log(`[${requestId}] Getting Camunda access token`);

  try {
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      audience: Netlify.env.get("CAMUNDA_AUDIENCE") || "zeebe.camunda.io",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(oauthUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to get Camunda token (${response.status}):`, errorText);
      throw new Error(`Failed to get Camunda access token: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[${requestId}] Camunda access token obtained successfully`);
    return data.access_token;
  } catch (error) {
    console.error(`[${requestId}] Error getting Camunda access token:`, error);
    throw new Error(`Failed to get Camunda access token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function markEmailAsRead(messageId: string, accessToken: string, requestId: string): Promise<void> {
  const gmailUserId = Netlify.env.get("GMAIL_USER_ID") || "me";

  try {
    const modifyUrl = `https://gmail.googleapis.com/gmail/v1/users/${gmailUserId}/messages/${messageId}/modify`;
    
    const response = await fetch(modifyUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["UNREAD"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to mark email as read (${response.status}):`, errorText);
    } else {
      console.log(`[${requestId}] Email ${messageId} marked as read`);
    }
  } catch (error) {
    console.error(`[${requestId}] Error marking email as read:`, error);
  }
}
