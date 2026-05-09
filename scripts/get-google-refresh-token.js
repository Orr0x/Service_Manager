const http = require("http");
const url = require("url");
const { google } = require("googleapis");
require("dotenv").config({ path: ".env.local" });

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3001/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_DRIVE_CLIENT_ID or GOOGLE_DRIVE_CLIENT_SECRET in .env.local");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/drive.file",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: scopes,
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);
console.log("\nWaiting for Google OAuth callback on http://localhost:3001/oauth2callback ...\n");

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const code = parsedUrl.query.code;

  if (!code) {
    res.writeHead(400);
    res.end("No code found in callback URL");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <h1>Success</h1>
      <p>You can close this browser tab and return to your terminal.</p>
    `);

    console.log("\nTokens returned from Google:\n");
    console.log(tokens);

    if (tokens.refresh_token) {
      console.log("\nCopy this into your .env.local:\n");
      console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      console.log("\nNo refresh_token returned.");
      console.log("Try revoking app access from your Google Account, then run this again.");
    }

    server.close();
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.writeHead(500);
    res.end("OAuth token exchange failed. Check terminal.");
    server.close();
  }
});

server.listen(3001);
