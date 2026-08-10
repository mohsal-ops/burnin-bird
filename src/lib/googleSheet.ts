import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function appendOrderToSheet(row: unknown[]) {
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: "Orders!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
}
