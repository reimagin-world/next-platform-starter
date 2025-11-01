import type { Context, Config } from "@netlify/functions";

interface DocumentRequest {
  documentName: string;
  documentId: string;
  base64Content: string;
  secretCode: string;
  mimeType?: string;
}

interface DocumentResponse {
  success: boolean;
  data?: {
    extractedData: any;
    confidenceScore: number;
    documentQualityScore: number;
  };
  error?: string;
  message?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export default async (req: Request, context: Context): Promise<Response> => {
  const requestId = crypto.randomUUID();
  
  try {
    console.log(`[${requestId}] Document processing request received`);
    console.log(`[${requestId}] Endpoint: /api/document-processing`);

    if (req.method !== "POST") {
      console.warn(`[${requestId}] Invalid method: ${req.method}`);
      return createErrorResponse(
        "Method not allowed. Only POST requests are accepted.",
        405,
        requestId
      );
    }

    let body: DocumentRequest;
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

    const dataValidationError = validateRequestData(body, requestId);
    if (dataValidationError) {
      return dataValidationError;
    }

    console.log(`[${requestId}] Processing document: ${body.documentName} (ID: ${body.documentId})`);
    console.log(`[${requestId}] Document extension: ${body.documentName.split('.').pop()}`);

    const geminiResult = await processDocumentWithGemini(
      body.base64Content,
      body.documentName,
      requestId,
      body.mimeType
    );

    console.log(`[${requestId}] Document processing completed successfully`);

    const response: DocumentResponse = {
      success: true,
      data: {
        extractedData: geminiResult.extractedData,
        confidenceScore: geminiResult.confidenceScore,
        documentQualityScore: geminiResult.documentQualityScore,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return createErrorResponse(
      "Internal server error occurred while processing document",
      500,
      requestId
    );
  }
};

function validateSecretCode(secretCode: string | undefined, requestId: string): Response | null {
  const expectedSecret = Netlify.env.get("DOCUMENT_PROCESSING_SECRET");

  if (!expectedSecret) {
    console.error(`[${requestId}] DOCUMENT_PROCESSING_SECRET not configured in environment`);
    return createErrorResponse(
      "Service configuration error",
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

function validateRequestData(data: DocumentRequest, requestId: string): Response | null {
  const errors: string[] = [];

  if (!data.documentName || typeof data.documentName !== "string" || data.documentName.trim() === "") {
    errors.push("documentName is required and must be a non-empty string");
  }

  if (!data.documentId || typeof data.documentId !== "string" || data.documentId.trim() === "") {
    errors.push("documentId is required and must be a non-empty string");
  }

  if (!data.base64Content || typeof data.base64Content !== "string" || data.base64Content.trim() === "") {
    errors.push("base64Content is required and must be a non-empty string");
  } else {
    const cleanedContent = data.base64Content.replace(/\s/g, "");
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(cleanedContent)) {
      errors.push("base64Content must be a valid base64 encoded string");
    }
    
    try {
      atob(cleanedContent.substring(0, 100));
    } catch {
      errors.push("base64Content appears to be corrupted or invalid");
    }
  }

  if (errors.length > 0) {
    console.warn(`[${requestId}] Data validation failed:`, errors);
    return createErrorResponse(
      `Data validation failed: ${errors.join(", ")}`,
      400,
      requestId
    );
  }

  console.log(`[${requestId}] Request data validated successfully`);
  return null;
}

async function processDocumentWithGemini(
  base64Content: string,
  documentName: string,
  requestId: string,
  providedMimeType?: string
): Promise<{
  extractedData: any;
  confidenceScore: number;
  documentQualityScore: number;
}> {
  const geminiApiKey = Netlify.env.get("GEMINI_API_KEY");
  const geminiModel = Netlify.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
  const geminiApiUrl = Netlify.env.get("GEMINI_API_URL") || "https://generativelanguage.googleapis.com/v1beta";

  if (!geminiApiKey) {
    console.error(`[${requestId}] GEMINI_API_KEY not configured in environment`);
    throw new Error("Gemini API key not configured");
  }

  const cleanedBase64 = cleanBase64Content(base64Content);
  const fileExtension = documentName.split('.').pop()?.toLowerCase();
  const mimeType = providedMimeType || getMimeTypeFromExtension(fileExtension, cleanedBase64);
  
  console.log(`[${requestId}] File extension: ${fileExtension}`);
  console.log(`[${requestId}] Detected/Provided MIME type: ${mimeType}`);
  console.log(`[${requestId}] Calling Gemini API with model: ${geminiModel}`);

  const prompt = `You are an intelligent document processing system. Analyze the provided document image and extract all relevant information in a structured format.

Document Name: ${documentName}

Please extract:
1. All text content from the document
2. Key-value pairs (e.g., names, dates, amounts, IDs, addresses)
3. Document type classification
4. Any tables or structured data
5. Provide a confidence score (0-100) for the extraction accuracy
6. Provide a document quality score (0-100) based on image clarity and readability

Return your response in the following JSON format:
{
  "documentType": "string",
  "extractedFields": {
    "field_name": "value"
  },
  "textContent": "string",
  "tables": [],
  "confidenceScore": number,
  "documentQualityScore": number
}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: cleanedBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
    },
  };

  console.log(`[${requestId}] Gemini API Request Details:`);
  console.log(`[${requestId}]   URL: ${geminiApiUrl}/models/${geminiModel}:generateContent`);
  console.log(`[${requestId}]   Method: POST`);
  console.log(`[${requestId}]   MIME Type: ${mimeType}`);
  console.log(`[${requestId}]   Base64 Content Length: ${cleanedBase64.length} characters`);
  console.log(`[${requestId}]   Prompt Length: ${prompt.length} characters`);
  console.log(`[${requestId}]   Full Request Body:`, JSON.stringify({
    ...requestBody,
    contents: requestBody.contents.map(content => ({
      ...content,
      parts: content.parts.map(part => 
        'inline_data' in part 
          ? { inline_data: { mime_type: part.inline_data.mime_type, data: `[BASE64_DATA_${part.inline_data.data.length}_CHARS]` } }
          : part
      )
    }))
  }, null, 2));

  try {
    const response = await fetch(
      `${geminiApiUrl}/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Gemini API error (${response.status}):`, errorText);
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const geminiResponse: GeminiResponse = await response.json();
    console.log(`[${requestId}] Gemini API response received successfully`);

    if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
      console.error(`[${requestId}] No candidates in Gemini response`);
      throw new Error("No response from Gemini API");
    }

    const resultText = geminiResponse.candidates[0].content.parts[0].text;
    const parsedResult = JSON.parse(resultText);

    console.log(`[${requestId}] Document extraction completed with confidence: ${parsedResult.confidenceScore}%`);

    return {
      extractedData: {
        documentType: parsedResult.documentType,
        extractedFields: parsedResult.extractedFields,
        textContent: parsedResult.textContent,
        tables: parsedResult.tables || [],
      },
      confidenceScore: parsedResult.confidenceScore || 0,
      documentQualityScore: parsedResult.documentQualityScore || 0,
    };
  } catch (error) {
    console.error(`[${requestId}] Error processing document with Gemini:`, error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function cleanBase64Content(base64Content: string): string {
  let cleaned = base64Content.trim();
  
  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[1] || cleaned;
  }
  
  cleaned = cleaned.replace(/[\r\n\s]/g, '');
  
  return cleaned;
}

function getMimeTypeFromExtension(extension: string | undefined, base64String: string): string {
  if (extension) {
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'txt':
        return 'text/plain';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'webp':
        return 'image/webp';
    }
  }

  try {
    const binaryString = atob(base64String.substring(0, 20));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return "image/png";
    }
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return "image/jpeg";
    }
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return "image/gif";
    }
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return "application/pdf";
    }
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
      return "application/msword";
    }
    if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return "image/bmp";
    }
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      return "image/webp";
    }
  } catch (error) {
    console.warn("Error decoding base64 for MIME type detection:", error);
  }
  
  console.warn("Could not determine MIME type, defaulting to application/pdf");
  return "application/pdf";
}

function createErrorResponse(message: string, status: number, requestId: string): Response {
  const response: DocumentResponse = {
    success: false,
    error: message,
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
  path: "/api/document-processing",
};
