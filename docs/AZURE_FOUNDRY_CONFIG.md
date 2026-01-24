# Azure Foundry Configuration

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Azure Foundry Agent Configuration
AZURE_FOUNDRY_ENDPOINT=https://your-foundry-endpoint.azure.com
AZURE_FOUNDRY_API_KEY=your-api-key-here
AZURE_FOUNDRY_DEPLOYMENT_NAME=your-deployment-name
AZURE_FOUNDRY_API_VERSION=2024-01-01

# Optional: Set which AI service to use (gemini or azureFoundry)
AI_SERVICE_PROVIDER=azureFoundry
```

## Azure Foundry Setup Guide

### Prerequisites
1. Azure subscription
2. Azure AI Foundry project created
3. Agent deployed in Azure AI Foundry
4. API key and endpoint URL

### Configuration Steps

#### 1. Get Your Azure Foundry Credentials
- Navigate to your Azure AI Foundry portal
- Go to your project settings
- Copy your endpoint URL and API key
- Note your deployment name

#### 2. Configure Environment Variables

##### Local Development:
Update your `.env` file with the credentials from step 1.

##### Azure Web App Production:
1. Go to Azure Portal: https://portal.azure.com
2. Navigate to your Web App resource
3. Go to **Settings** → **Configuration**
4. Under **Application settings**, click **+ New application setting**
5. Add each variable:
   - Name: `AZURE_FOUNDRY_ENDPOINT`, Value: `https://your-endpoint.azure.com`
   - Name: `AZURE_FOUNDRY_API_KEY`, Value: `your-api-key`
   - Name: `AZURE_FOUNDRY_DEPLOYMENT_NAME`, Value: `your-deployment`
   - Name: `AZURE_FOUNDRY_API_VERSION`, Value: `2024-01-01`
6. Click **Save**
7. **Restart** your Web App for changes to take effect

#### 3. Backend Implementation
The backend needs to implement two endpoints:
- `POST /api/azure-foundry/chat` - For conversation
- `POST /api/azure-foundry/classify` - For case classification

See `server-azure-foundry-example.js` for reference implementation.

### Request Format

#### Chat Endpoint
```json
{
  "history": [
    {"role": "user", "content": "Mensaje anterior"},
    {"role": "assistant", "content": "Respuesta anterior"}
  ],
  "newMessage": "Nuevo mensaje del usuario",
  "userRole": "student" // or "parent", "teacher", "admin", "staff"
}
```

#### Classification Endpoint
```json
{
  "messages": [
    {"role": "user", "content": "Todo el historial de conversación"},
    {"role": "assistant", "content": "..."}
  ]
}
```

### Response Format

#### Chat Response
```json
{
  "response": "Respuesta del agente"
}
```

#### Classification Response
```json
{
  "typology": "Acoso escolar (bullying)",
  "riskLevel": "high",
  "summary": "Resumen del caso",
  "recommendations": ["Recomendación 1", "Recomendación 2"],
  "psychographics": {
    "interests": [],
    "values": [],
    "motivations": [],
    "lifestyle": [],
    "personalityTraits": []
  }
}
```

## Switching Between Gemini and Azure Foundry

The application now supports both AI providers. To switch between them:

### Option 1: Environment Variable (Recommended)
Set `AI_SERVICE_PROVIDER` in your `.env` file:
- `AI_SERVICE_PROVIDER=gemini` - Use Gemini (default)
- `AI_SERVICE_PROVIDER=azureFoundry` - Use Azure Foundry

### Option 2: Manual Code Change
Edit `ChatInterface.tsx` to import from the desired service:
```typescript
// For Gemini:
import { sendMessageToGemini, classifyCaseWithGemini } from '../services/geminiService';

// For Azure Foundry:
import { sendMessageToAzureFoundry, classifyCaseWithAzureFoundry } from '../services/azureFoundryService';
```

## Testing

Test the Azure Foundry integration:
```bash
# Test chat endpoint
curl -X POST http://localhost:5000/api/azure-foundry/chat \
  -H "Content-Type: application/json" \
  -d '{"history": [], "newMessage": "Hola", "userRole": "student"}'

# Test classification endpoint
curl -X POST http://localhost:5000/api/azure-foundry/classify \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Me están molestando en la escuela"}]}'
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your API key
2. **404 Not Found**: Verify your endpoint URL and deployment name
3. **Timeout errors**: Check network connectivity and Azure service status
4. **Rate limiting**: Implement retry logic with exponential backoff

### Debug Mode
Enable debug logging in your backend:
```javascript
console.log('Azure Foundry Request:', {
  endpoint: process.env.AZURE_FOUNDRY_ENDPOINT,
  deployment: process.env.AZURE_FOUNDRY_DEPLOYMENT_NAME
});
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use Azure Key Vault** for production credentials
3. **Rotate API keys** regularly
4. **Implement rate limiting** on your backend
5. **Use HTTPS only** for all API calls
6. **Monitor API usage** through Azure portal

## Cost Management

- Monitor API usage in Azure portal
- Set up billing alerts
- Implement caching for frequently asked questions
- Consider implementing conversation summarization to reduce token usage
