// /api/extract-bean
//   POST { url } — fetch a roaster's coffee page and extract structured bean
//   details with Claude, for review before saving as a new cup.
import Anthropic from '@anthropic-ai/sdk';

const MAX_PAGE_CHARS = 14000;

// Tool schema for structured JSON extraction. Fields are optional — the model
// fills only what the page actually states rather than guessing.
const SAVE_BEAN_TOOL = {
  name: 'save_bean',
  description: 'Record the coffee bean details found on the page.',
  input_schema: {
    type: 'object',
    properties: {
      bean: { type: 'string', description: 'The coffee / lot name (not the roaster).' },
      roaster: { type: 'string', description: 'The roaster or brand name.' },
      origin: { type: 'string', description: 'Country of origin, e.g. "Ethiopia".' },
      region: { type: 'string', description: 'Growing region, e.g. "Yirgacheffe".' },
      process: { type: 'string', description: 'Process, e.g. "Washed", "Natural".' },
      roastLevel: { type: 'string', description: 'Roast level, e.g. "Light".' },
      variety: { type: 'string', description: 'Variety / cultivar, e.g. "Heirloom".' },
      altitude: { type: 'string', description: 'Growing altitude, e.g. "1900-2100 masl".' },
      notes: { type: 'string', description: 'Tasting notes as a short comma-separated list.' },
    },
    required: [],
  },
};

/** Crudely strip a fetched HTML document to visible-ish text. */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' });
  }

  const url = (req.body && req.body.url ? String(req.body.url) : '').trim();
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Provide a valid http(s) link to a coffee.' });
  }

  let pageText;
  try {
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'CupboardBot/1.0 (+coffee log)' },
      redirect: 'follow',
    });
    if (!pageRes.ok) {
      return res.status(502).json({ error: `Couldn't load that page (HTTP ${pageRes.status}).` });
    }
    pageText = htmlToText(await pageRes.text()).slice(0, MAX_PAGE_CHARS);
  } catch (err) {
    console.error('[api/extract-bean] fetch failed:', err);
    return res.status(502).json({ error: 'Couldn’t reach that link.' });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools: [SAVE_BEAN_TOOL],
      tool_choice: { type: 'tool', name: 'save_bean' },
      messages: [
        {
          role: 'user',
          content:
            'Extract the coffee bean details from this product page. Only include ' +
            'fields the page actually states; omit anything you are unsure about. ' +
            `Source URL: ${url}\n\nPage text:\n${pageText}`,
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === 'tool_use');
    const bean = toolUse && toolUse.input ? toolUse.input : {};
    return res.status(200).json({ bean });
  } catch (err) {
    console.error('[api/extract-bean] extraction failed:', err);
    return res.status(502).json({ error: err.message || 'Extraction failed' });
  }
}
