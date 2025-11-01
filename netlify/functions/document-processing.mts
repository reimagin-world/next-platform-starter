import type { Context, Config } from "@netlify/functions";

interface DocumentRequest {
  documentName: string;
  documentId: string;
  base64Content: string;
  secretCode: string;
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

    const geminiResult = await processDocumentWithGemini(
      body.base64Content,
      body.documentName,
      requestId
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
    const cleanedBase64 = data.base64Content.replace(/\s/g, "");
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(cleanedBase64)) {
      errors.push("base64Content must be a valid base64 encoded string");
    } else if (cleanedBase64.length < 100) {
      errors.push("base64Content appears to be too short to be a valid image");
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
  requestId: string
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

  const cleanedBase64 = base64Content.replace(/\s/g, "");
  let mimeType: string;
  
  try {
    mimeType = getMimeTypeFromBase64(cleanedBase64);
    console.log(`[${requestId}] Detected MIME type: ${mimeType}`);
  } catch (error) {
    console.error(`[${requestId}] MIME type detection failed:`, error);
    throw new Error(`Invalid image format: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

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

function getMimeTypeFromBase64(base64String: string): string {
  const cleanedBase64 = base64String.replace(/\s/g, "");
  
  if (cleanedBase64.length < 20) {
    throw new Error("Base64 string too short to determine MIME type");
  }

  const signature = cleanedBase64.substring(0, 50);

  if (signature.startsWith("iVBORw0KGgo")) return "image/png";
  if (signature.startsWith("/9j/")) return "image/jpeg";
  if (signature.startsWith("R0lGOD")) return "image/gif";
  if (signature.startsWith("UklGR") && cleanedBase64.includes("V0VCUFZQOC")) return "image/webp";
  if (signature.startsWith("Qk")) return "image/bmp";
  if (signature.startsWith("SUkq") || signature.startsWith("TU0q")) return "image/tiff";
  if (signature.startsWith("JVBERi")) return "application/pdf";
  if (signature.startsWith("UEs")) return "application/vnd.openxmlformats-officedocument";

  throw new Error(
    "Unsupported or invalid image format. Supported formats: PNG, JPEG, GIF, WebP, BMP, TIFF, PDF"
  );
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
