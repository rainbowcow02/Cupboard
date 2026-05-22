// /api/cups
//   GET  — every brewed-cup row from the Notion table, normalized.
//   POST — create a new brewed-cup row from a cup payload.
// The browser groups GET results into coffees (see src/lib/coffees.js).
import {
  notion, DATABASE_ID, notionConfigured, rowToCup, cupToProperties,
} from './_notion.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!notionConfigured()) {
    return res.status(500).json({
      error: 'Notion is not configured. Set NOTION_TOKEN and NOTION_DATABASE_ID.',
    });
  }

  if (req.method === 'POST') {
    try {
      const page = await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: cupToProperties(req.body || {}),
      });
      return res.status(201).json({ cup: rowToCup(page) });
    } catch (err) {
      console.error('[api/cups] Notion create failed:', err);
      return res.status(502).json({ error: err.message || 'Notion create failed' });
    }
  }

  try {
    const cups = [];
    let cursor;
    do {
      const resp = await notion.databases.query({
        database_id: DATABASE_ID,
        start_cursor: cursor,
        page_size: 100,
      });
      for (const page of resp.results) cups.push(rowToCup(page));
      cursor = resp.has_more ? resp.next_cursor : undefined;
    } while (cursor);

    return res.status(200).json({ cups });
  } catch (err) {
    console.error('[api/cups] Notion query failed:', err);
    return res.status(502).json({ error: err.message || 'Notion query failed' });
  }
}
