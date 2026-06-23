import { Router } from "express";
import Check from "../models/Check.js";
import puppeteer from "puppeteer";

const router = Router();

// GET /api/report/:id - Get a check by id (public, for sharing)
// Returns JSON by default, or PDF if ?format=pdf query param is passed
router.get("/:id", async (req, res) => {
  try {
    const check = await Check.findById(req.params.id);

    if (!check) {
      return res.status(404).json({ message: "Check not found" });
    }

    // If format=pdf query param is passed, generate and return PDF
    if (req.query.format === "pdf") {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // Generate HTML template
      const html = generateReportHTML(check);

      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="truthlens-report-${check._id}.pdf"`
      );
      return res.send(pdfBuffer);
    }

    // Return JSON by default
    res.json(check);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Check not found" });
    }
    res.status(500).json({ message: "Error fetching report", error: error.message });
  }
});

// Helper function to generate HTML template for the report
function generateReportHTML(check) {
  const verdictColors = {
    "True": "#22c55e",
    "False": "#ef4444",
    "Partially True": "#f59e0b",
    "Unverified": "#6b7280",
    "Misleading": "#f97316",
  };

  const claimsHTML = check.claims
    .map(
      (claim) => `
    <div class="claim-card">
      <div class="claim-text">${escapeHtml(claim.text)}</div>
      <div class="claim-verdict" style="background-color: ${verdictColors[claim.verdict] || "#6b7280"}">
        ${escapeHtml(claim.verdict)}
      </div>
      ${claim.sources && claim.sources.length > 0 ? `
        <div class="claim-sources">
          <div class="sources-label">Sources:</div>
          <ul>
            ${claim.sources.map((source) => `<li><a href="${escapeHtml(source)}" target="_blank">${escapeHtml(source)}</a></li>`).join("")}
          </ul>
        </div>
      ` : ""}
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TruthLens Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #f9fafb;
      color: #111827;
      line-height: 1.6;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 32px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .original-text {
      background-color: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      font-size: 15px;
      color: #1f2937;
    }
    .scores {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .score-card {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    .score-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .score-value {
      font-size: 32px;
      font-weight: 700;
      color: #374151;
    }
    .claim-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .claim-text {
      font-size: 16px;
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 12px;
    }
    .claim-verdict {
      display: inline-block;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .claim-sources {
      margin-top: 12px;
    }
    .sources-label {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .claim-sources ul {
      list-style: none;
      padding-left: 0;
    }
    .claim-sources li {
      font-size: 13px;
      color: #4b5563;
      margin-bottom: 4px;
    }
    .claim-sources a {
      color: #667eea;
      text-decoration: none;
    }
    .claim-sources a:hover {
      text-decoration: underline;
    }
    .meta {
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TruthLens Report</h1>
      <div class="subtitle">AI-Powered Fact Checking Analysis</div>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Original Content</div>
        <div class="original-text">${escapeHtml(check.originalText)}</div>
      </div>

      <div class="section">
        <div class="section-title">Trust Scores</div>
        <div class="scores">
          <div class="score-card">
            <div class="score-label">AI Score</div>
            <div class="score-value">${check.aiScore}</div>
          </div>
          <div class="score-card">
            <div class="score-label">Source Score</div>
            <div class="score-value">${check.sourceScore}</div>
          </div>
          <div class="score-card">
            <div class="score-label">Trust Score</div>
            <div class="score-value">${check.trustScore}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Claim Analysis</div>
        ${claimsHTML}
      </div>

      <div class="meta">
        Generated on ${new Date().toLocaleString()} | Input Type: ${escapeHtml(check.inputType)} | Language: ${escapeHtml(check.language)}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default router;
