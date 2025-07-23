// server.js
import express from "express";
import morgan from "morgan";
import path from "path";
import fs from "fs/promises";
import juice from "juice";
import { v4 as uuidv4 } from "uuid";
import { load } from "cheerio";

const app = express();

// --- Configuration ---
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(morgan("dev"));
app.use(express.text({ limit: '50mb', type: 'text/html' }));
app.use(express.json({ limit: '50mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Filename');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// --- Helpers ---
/**
 * Process HTML content - inline CSS styles and remap IDs
 */
async function processHtml(htmlContent) {
  if (!htmlContent) {
    throw new Error('HTML content is required');
  }

  // 1) Inline all CSS from <style> into style="" and remove <style> tags
  let html = juice(htmlContent, {
    applyStyleTags: true,
    removeStyleTags: true,
    preserveMediaQueries: true,
  });

  // 2) Remap any auto-generated iXYZ IDs to UUID-based ones
  const $ = load(html);
  $('[id^="i"]').each((_, el) => {
    const $el = $(el);
    const oldId = $el.attr("id");
    const newId = "id-" + uuidv4();
    $el.attr("id", newId);

    // update any <a href="#oldId"> or <label for="oldId">
    $(`[href="#${oldId}"], [for="${oldId}"]`).each((_, ref) => {
      const $ref = $(ref);
      if ($ref.attr("href")) $ref.attr("href", `#${newId}`);
      if ($ref.attr("for")) $ref.attr("for", newId);
    });
  });

  return $.html();
}

// --- Routes ---
// View in browser - uses template.html if available
app.get("/", async (req, res, next) => {
  try {
    const templatePath = path.resolve("template.html");
    const htmlContent = await fs.readFile(templatePath, "utf8");
    const html = await processHtml(htmlContent);
    res.type("html").send(html);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ 
        error: 'Template file not found', 
        message: 'Use POST /process endpoint to process HTML content via API' 
      });
    } else {
      next(err);
    }
  }
});

// Download template file - uses template.html if available
app.get("/download", async (req, res, next) => {
  try {
    const templatePath = path.resolve("template.html");
    const htmlContent = await fs.readFile(templatePath, "utf8");
    const html = await processHtml(htmlContent);
    res.set({
      "Content-Type": "text/html; charset=UTF-8",
      "Content-Disposition": 'attachment; filename="newsletter.html"',
    });
    res.send(html);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ 
        error: 'Template file not found', 
        message: 'Use POST /process-download endpoint to process HTML content via API' 
      });
    } else {
      next(err);
    }
  }
});

// Process HTML via API - accepts HTML content and optional filename
app.post("/process", async (req, res, next) => {
  try {
    const htmlContent = req.body;
    const filename = req.headers['x-filename'] || 'newsletter.html';
    
    if (!htmlContent) {
      return res.status(400).json({ error: 'No HTML content provided' });
    }

    const processedHtml = await processHtml(htmlContent);
    
    res.json({
      success: true,
      html: processedHtml,
      filename: filename
    });
  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process HTML',
      message: err.message 
    });
  }
});

// Process and download HTML via API - accepts HTML content and returns as download
app.post("/process-download", async (req, res, next) => {
  try {
    const htmlContent = req.body;
    const filename = req.headers['x-filename'] || 'newsletter.html';
    
    if (!htmlContent) {
      return res.status(400).json({ error: 'No HTML content provided' });
    }

    const processedHtml = await processHtml(htmlContent);
    
    res.set({
      "Content-Type": "text/html; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
    res.send(processedHtml);
  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process HTML',
      message: err.message 
    });
  }
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀  Server is working!`);
});
