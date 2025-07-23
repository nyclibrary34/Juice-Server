# Juice Server - CSS Inlining & ID Cleanup Service

A Node.js Express service that processes HTML content to inline CSS styles and replace auto-generated IDs with UUIDs. Designed specifically for email-ready newsletter exports from the GrapesJS newsletter builder.

## Features

- **CSS Inlining**: Converts `<style>` blocks to inline `style=""` attributes using Juice
- **ID Cleanup**: Replaces auto-generated IDs (like `i1`, `i2`) with proper UUIDs
- **Reference Updates**: Automatically updates `href="#id"` and `for="id"` references
- **Email Compatibility**: Optimizes HTML for better email client support
- **CORS Enabled**: Ready for cross-origin requests from web applications

## API Endpoints

### `POST /process`
Process HTML content and return JSON response with inlined CSS and clean IDs.

**Request:**
```bash
curl -X POST http://localhost:3000/process \
  -H "Content-Type: text/html" \
  -H "X-Filename: newsletter.html" \
  -d '<!doctype html><html><head><style>.test{color:red;}</style></head><body><div id="i1" class="test">Content</div></body></html>'
```

**Response:**
```json
{
  "success": true,
  "html": "<html><head></head><body><div id=\"id-uuid-here\" class=\"test\" style=\"color: red;\">Content</div></body></html>",
  "filename": "newsletter.html"
}
```

### `POST /process-download`
Process HTML content and return as downloadable file.

**Request:**
```bash
curl -X POST http://localhost:3000/process-download \
  -H "Content-Type: text/html" \
  -H "X-Filename: my-newsletter.html" \
  -d '<!doctype html><html><head><style>.test{color:red;}</style></head><body><div id="i1" class="test">Content</div></body></html>' \
  --output processed-newsletter.html
```

**Response:**
- Returns processed HTML as file download
- Sets proper `Content-Disposition` header with filename
- Content-Type: `text/html; charset=UTF-8`

### `GET /`
View processed template (requires `template.html` file in root directory).

### `GET /download`
Download processed template file (requires `template.html` file in root directory).

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Local Development
```bash
# Clone and navigate to juice server directory
cd juice_server

# Install dependencies
npm install

# Start development server
npm start
# Server will run on http://localhost:3000

# Or start with custom port
PORT=3001 npm start
```

### Dependencies
- **express**: Web framework
- **juice**: CSS inlining library
- **cheerio**: Server-side jQuery for DOM manipulation
- **uuid**: UUID generation for clean IDs
- **morgan**: HTTP request logging

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)

### CORS Configuration
The server accepts requests from any origin (`*`) with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Filename`

## Usage Examples

### Basic CSS Inlining
```javascript
// Input HTML
const html = `
<!doctype html>
<html>
  <head>
    <style>
      .header { background: blue; color: white; }
      .content { padding: 20px; }
    </style>
  </head>
  <body>
    <div id="i1" class="header">Header</div>
    <div id="i2" class="content">Content</div>
  </body>
</html>
`;

// After processing:
// - CSS is inlined as style="" attributes
// - IDs i1, i2 become UUID-based IDs
// - <style> tag is removed
```

### Integration with Newsletter Builder
```javascript
// Frontend JavaScript (in GrapesJS editor)
const response = await fetch('http://localhost:3000/process-download', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/html',
    'X-Filename': 'newsletter.html'
  },
  body: fullHtmlContent
});

const processedBlob = await response.blob();
// Trigger download...
```

## Processing Details

### CSS Inlining Process
1. Parses HTML and extracts CSS from `<style>` tags
2. Applies CSS rules to matching elements as inline styles
3. Removes original `<style>` tags
4. Preserves media queries when possible

### ID Replacement Process
1. Finds all elements with IDs starting with "i" (auto-generated pattern)
2. Generates UUID-based replacement IDs (`id-uuid`)
3. Updates all references:
   - `<a href="#oldId">` → `<a href="#newId">`
   - `<label for="oldId">` → `<label for="newId">`

### Email Optimization
- Removes `<style>` blocks (many email clients strip them)
- Inlines all CSS for maximum compatibility
- Preserves media queries for responsive design
- Generates clean, professional ID attributes

## Error Handling

### Common Errors
- **400 Bad Request**: No HTML content provided
- **500 Internal Server Error**: Processing failed (invalid HTML, etc.)

### Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

## Performance Considerations

- **Request Size Limit**: 50MB for HTML content
- **Processing Speed**: Optimized for typical newsletter sizes
- **Memory Usage**: Efficient DOM manipulation with Cheerio
- **Concurrent Requests**: Express handles multiple simultaneous requests

## Integration Notes

### Newsletter Builder Integration
This service is designed to work with the GrapesJS newsletter builder:
- Processes editor output (HTML + CSS)
- Maintains original filename from editor
- Returns email-ready HTML for download

### Security Considerations
- No file system access (processes content in memory)
- No external network requests during processing
- Stateless processing (no data persistence)
- Input validation for HTML content

## Development & Testing

### Testing the Service
```bash
# Test basic processing
curl -X POST http://localhost:3000/process \
  -H "Content-Type: text/html" \
  -d '<html><head><style>body{color:red;}</style></head><body id="i1">Test</body></html>'

# Test file download
curl -X POST http://localhost:3000/process-download \
  -H "Content-Type: text/html" \
  -H "X-Filename: test.html" \
  -d '<html><head><style>body{color:red;}</style></head><body id="i1">Test</body></html>' \
  --output test-output.html
```

### Adding Features
- Extend processing in the `processHtml()` function
- Add new endpoints following the existing pattern
- Maintain CORS configuration for web app integration

## Deployment

See `vercel.json` for Vercel serverless deployment configuration. The service can also be deployed on:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS Lambda (with adapter)
- Any Node.js hosting platform

## License

Part of the GrapesJS Newsletter Builder project.