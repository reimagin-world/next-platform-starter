# Document Processing API

## Overview

This serverless function provides a REST API endpoint for intelligent document processing using Google's Gemini LLM. It extracts structured data from documents provided as base64-encoded content.

## API Endpoint

**URL:** `/api/document-processing`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Request Format

```json
{
  "documentName": "invoice.pdf",
  "documentId": "DOC-12345",
  "base64Content": "iVBORw0KGgoAAAANSUhEUgA...",
  "secretCode": "your-secret-code"
}
```

### Request Fields

- `documentName` (string, required): Name of the document being processed
- `documentId` (string, required): Unique identifier for the document
- `base64Content` (string, required): Base64-encoded content of the document (supports images and PDFs)
- `secretCode` (string, required): Secret code for authentication (must match environment variable)

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "extractedData": {
      "documentType": "Invoice",
      "extractedFields": {
        "invoiceNumber": "INV-001",
        "date": "2025-11-01",
        "amount": "$1,234.56"
      },
      "textContent": "Full text content...",
      "tables": []
    },
    "confidenceScore": 95,
    "documentQualityScore": 88
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Data
```json
{
  "success": false,
  "error": "Data validation failed: documentName is required and must be a non-empty string"
}
```

#### 401 Unauthorized - Missing Secret
```json
{
  "success": false,
  "error": "Secret code is required"
}
```

#### 403 Forbidden - Invalid Secret
```json
{
  "success": false,
  "error": "Invalid secret code"
}
```

#### 405 Method Not Allowed
```json
{
  "success": false,
  "error": "Method not allowed. Only POST requests are accepted."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error occurred while processing document"
}
```

## Required Environment Variables

Configure these environment variables in your Netlify site settings:

### Required Variables

- `DOCUMENT_PROCESSING_SECRET` (required): Secret code for API authentication
- `GEMINI_API_KEY` (required): Google Gemini API key for document processing

### Optional Variables

- `GEMINI_MODEL` (optional, default: "gemini-1.5-flash"): Gemini model to use
- `GEMINI_API_URL` (optional, default: "https://generativelanguage.googleapis.com/v1beta"): Gemini API base URL

## Setting Environment Variables

### Via Netlify UI
1. Go to Site settings > Environment variables
2. Add each required variable with its value
3. Deploy your site for changes to take effect

### Via Netlify CLI
```bash
netlify env:set DOCUMENT_PROCESSING_SECRET your-secret-code
netlify env:set GEMINI_API_KEY your-gemini-api-key
```

## Supported Document Formats

The API automatically detects and processes:
- PNG images (`image/png`)
- JPEG images (`image/jpeg`)
- GIF images (`image/gif`)
- PDF documents (`application/pdf`)
- Office documents (`application/vnd.openxmlformats-officedocument`)

## Logging

Each request is assigned a unique request ID for tracking. All logs include this ID for easy debugging:

```
[request-id] Document processing request received
[request-id] Request body parsed successfully
[request-id] Secret code validated successfully
[request-id] Request data validated successfully
[request-id] Processing document: invoice.pdf (ID: DOC-12345)
[request-id] Calling Gemini API with model: gemini-1.5-flash
[request-id] Document extraction completed with confidence: 95%
```

## Example Usage

### Using cURL

```bash
curl -X POST https://your-site.netlify.app/api/document-processing \
  -H "Content-Type: application/json" \
  -d '{
    "documentName": "invoice.pdf",
    "documentId": "DOC-12345",
    "base64Content": "iVBORw0KGgoAAAANSUhEUgA...",
    "secretCode": "your-secret-code"
  }'
```

### Using JavaScript

```javascript
const response = await fetch('/api/document-processing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    documentName: 'invoice.pdf',
    documentId: 'DOC-12345',
    base64Content: base64String,
    secretCode: 'your-secret-code',
  }),
});

const result = await response.json();
if (result.success) {
  console.log('Extracted data:', result.data.extractedData);
  console.log('Confidence:', result.data.confidenceScore);
  console.log('Quality:', result.data.documentQualityScore);
}
```

## Local Testing

To test the function locally:

```bash
# Start the Netlify dev server
netlify dev

# The API will be available at:
# http://localhost:8888/api/document-processing
```

## Security Considerations

1. **Secret Code**: Always keep your `DOCUMENT_PROCESSING_SECRET` secure and never commit it to version control
2. **API Key**: Store your `GEMINI_API_KEY` securely in environment variables
3. **Request Validation**: All requests are validated for proper format and authentication
4. **Error Handling**: Errors are logged but sensitive information is not exposed in API responses
5. **Request IDs**: Each request includes a unique ID in the `X-Request-ID` header for tracking

## Troubleshooting

### "Service configuration error"
- Ensure `DOCUMENT_PROCESSING_SECRET` is set in environment variables

### "Gemini API key not configured"
- Ensure `GEMINI_API_KEY` is set in environment variables

### "Invalid secret code"
- Verify the `secretCode` in your request matches the `DOCUMENT_PROCESSING_SECRET` environment variable

### "Data validation failed"
- Check that all required fields are provided and properly formatted
- Ensure `base64Content` is valid base64-encoded data
