import { google, sheets_v4 } from "googleapis";
import fs from "fs";

const SHEET_ID = process.env.GOOGLE_SHEET_ID as string;

// Resolve service-account credentials from either a JSON key file
// (GOOGLE_SA_KEY_FILE) or the individual env vars.
function getCredentials(): { email: string; key: string } {
  const keyFile = process.env.GOOGLE_SA_KEY_FILE;
  if (keyFile && fs.existsSync(keyFile)) {
    const json = JSON.parse(fs.readFileSync(keyFile, "utf8"));
    return { email: json.client_email, key: json.private_key };
  }
  return {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
    key: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  };
}

// Header rows for each tab. The first column of data tabs is a timestamp,
// the second is the user email — both auto-recorded on submit.
export const TABS = {
  Users: ["email", "passwordHash", "name", "createdAt"],
  CapacityPlanning: [
    "timestamp",
    "userEmail",
    "factory",
    "month",
    "availableHr",
    "capacity",
    "projection",
    "currentUtilizationPct",
    "peakUtilizationPct",
    "bottleneckArea",
    "expandableCapacity",
  ],
  BottleneckAnalysis: [
    "timestamp",
    "userEmail",
    "factory",
    "availableHr",
    "process",
    "currentCapacity",
    "requiredCapacity",
    "gap",
    "actionRequired",
  ],
} as const;

export type TabName = keyof typeof TABS;

let cachedClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const { email, key } = getCredentials();
  if (!email || !key || !SHEET_ID) {
    throw new Error(
      "Missing Google Sheets credentials. Set GOOGLE_SA_KEY_FILE (path to the JSON key) or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY, plus GOOGLE_SHEET_ID."
    );
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

// Make sure a tab exists with its header row. Safe to call repeatedly.
async function ensureTab(tab: TabName) {
  const sheets = getClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === tab);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tab } } }],
      },
    });
  }

  // Ensure header row is present.
  const headerRange = `${tab}!A1`;
  const current = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1:1`,
  });
  if (!current.data.values || current.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: { values: [[...TABS[tab]]] },
    });
  }
}

export async function appendRow(tab: TabName, row: (string | number)[]) {
  await ensureTab(tab);
  const sheets = getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

export async function getRows(tab: TabName): Promise<Record<string, string>[]> {
  await ensureTab(tab);
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A:Z`,
  });
  const rows = res.data.values ?? [];
  if (rows.length < 2) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h] = (r[i] ?? "").toString()));
    return obj;
  });
}

export async function findUser(email: string) {
  const users = await getRows("Users");
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}
