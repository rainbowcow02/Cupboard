// /api/cups/:id
//   PATCH  — update a brewed-cup row (only the fields sent are changed).
//   DELETE — archive a brewed-cup row in Notion.
import { notion, notionConfigured, rowToCup, cupToProperties } from '../_notion.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: 'Missing cup id' });

  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!notionConfigured()) {
    return res.status(500).json({
      error: 'Notion is not configured. Set NOTION_TOKEN and NOTION_DATABASE_ID.',
    });
  }

  try {
    if (req.method === 'DELETE') {
      await notion.pages.update({ page_id: id, archived: true });
      return res.status(200).json({ ok: true });
    }
    const page = await notion.pages.update({
      page_id: id,
      properties: cupToProperties(req.body || {}),
    });
    return res.status(200).json({ cup: rowToCup(page) });
  } catch (err) {
    console.error(`[api/cups/${id}] Notion ${req.method} failed:`, err);
    return res.status(502).json({ error: err.message || 'Notion request failed' });
  }
}
