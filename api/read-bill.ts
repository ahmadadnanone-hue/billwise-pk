// Server function: POST /api/read-bill
//
// Runs on Vercel, NOT on the phone, so the AI key stays secret.
// It accepts one of three things (see ReadBillRequest):
//   - image:     a photo of a paper bill            → option C (scan)
//   - page:      text of a bill web page the phone opened → option A (auto-fetch)
//   - reference: just a reference number; the server opens the bill page itself
//                (used by the web version, where browsers block opening other sites)
// and returns the bill details the AI found.

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { BillReadingSchema, type ReadBillRequest, type ReadBillResponse } from '../shared/bill-reading';
import { getProvider, PROVIDERS } from '../shared/providers';
import { htmlToText } from '../shared/html';

// Claude's image limit is 5 MB; base64 text is ~4/3 the size of the file.
const MAX_IMAGE_BASE64 = 6_600_000;
const MAX_PAGE_CHARS = 40_000;

const SYSTEM_PROMPT = `You read Pakistani utility and fee bills (electricity, gas, water, internet, phone, school fees) and pull out the key details for a bill-tracking app.

Rules:
- Only report what is actually printed. If a value is missing or unreadable, use null. Never guess numbers.
- Amounts are in Pakistani rupees, as plain numbers without commas (e.g. 4520).
- amount_due is the amount "payable within due date". amount_after_due_date is the amount "payable after due date" (with late surcharge).
- Dates: bill_month as "YYYY-MM", due_date as "YYYY-MM-DD". Bills often print dates like "25 OCT 26" or "OCT 26"; convert them using today's date for context.
- units_used: units consumed this month (kWh for electricity, hm3/MMBTU for gas). units_label: the unit name.
- provider_id: one of [${PROVIDERS.map((p) => p.id).join(', ')}] if the bill clearly comes from that company, otherwise "other".
- summary: one or two short, plain-English sentences a non-expert would find useful, e.g. how this month compares to last month if the bill shows past months, or that the due date has passed. No advice beyond what the bill shows.
- If the input is not a bill, or the bill page says the reference number is invalid, set found=false and explain briefly in problem.`;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the server's settings

function json(body: ReadBillResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  });
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-billwise-key',
};

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  // Optional "speed bump" so random people can't use your AI credit.
  // Not real security (the key ships inside the app), but stops casual abuse.
  const appKey = process.env.BILLWISE_APP_KEY;
  if (appKey && request.headers.get('x-billwise-key') !== appKey) {
    return json({ ok: false, error: 'Not allowed.' }, 401);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ ok: false, error: 'The server is missing its AI key (ANTHROPIC_API_KEY).' }, 500);
  }

  let body: ReadBillRequest;
  try {
    body = (await request.json()) as ReadBillRequest;
  } catch {
    return json({ ok: false, error: 'Request was not valid JSON.' }, 400);
  }

  let content: Anthropic.Beta.BetaContentBlockParam[];
  try {
    content = await buildContent(body);
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 400);
  }

  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      // Reading a bill is a simple job, so we ask for low effort: faster and cheaper.
      output_config: { effort: 'low', format: betaZodOutputFormat(BillReadingSchema) },
      // If the main model declines for safety reasons, let Anthropic retry on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [{ role: 'user', content }],
    });

    if (response.stop_reason === 'refusal') {
      return json({ ok: false, error: 'The AI could not read this bill. Please try another photo.' }, 422);
    }
    if (!response.parsed_output) {
      return json({ ok: false, error: 'The AI reply could not be understood. Please try again.' }, 502);
    }
    return json({ ok: true, reading: response.parsed_output });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return json({ ok: false, error: 'Too many requests right now. Please try again in a minute.' }, 429);
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Claude API error', err.status, err.message);
      return json({ ok: false, error: 'The AI service had a problem. Please try again.' }, 502);
    }
    console.error('Unexpected error', err);
    return json({ ok: false, error: 'Something went wrong on the server.' }, 500);
  }
}

async function buildContent(body: ReadBillRequest): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
  const today = `Today's date is ${new Date().toISOString().slice(0, 10)}.`;

  if (body.kind === 'image') {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(body.mediaType)) {
      throw new Error('Please use a JPG, PNG or WEBP photo.');
    }
    if (!body.data || body.data.length > MAX_IMAGE_BASE64) {
      throw new Error('The photo is too large. Please use a smaller one (under 5 MB).');
    }
    return [
      { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.data } },
      { type: 'text', text: `${today} Read this photo of a bill.` },
    ];
  }

  const provider = getProvider(body.providerId);
  if (!provider?.billPageUrl) throw new Error('This company does not support automatic fetching.');
  if (!body.reference || body.reference.length > 40) throw new Error('Invalid reference number.');

  let pageText: string;
  if (body.kind === 'page') {
    pageText = String(body.pageText ?? '').slice(0, MAX_PAGE_CHARS);
  } else if (body.kind === 'reference') {
    // We only ever open the company's own bill URL, never an address sent by the app.
    pageText = await fetchBillPage(provider.billPageUrl(body.reference));
  } else {
    throw new Error('Unknown request type.');
  }
  if (pageText.trim().length < 50) throw new Error('The bill page was empty. Please try again later.');

  return [
    {
      type: 'text',
      text:
        `${today} Below is the text of the ${provider.name} bill web page for reference number ${body.reference}. ` +
        `Read the current bill from it.\n\n<bill_page>\n${pageText}\n</bill_page>`,
    },
  ];
}

async function fetchBillPage(url: string): Promise<string> {
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; BillWisePK/2.0)' },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error('Could not reach the bill website from our server. Please use the phone app or scan the bill.');
  }
  if (!res.ok) {
    throw new Error(`The bill website answered with error ${res.status}. It may only allow visitors from Pakistan.`);
  }
  return htmlToText(await res.text());
}
