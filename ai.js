const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

function extractOutputText(response) {
  if (response.output_text) return response.output_text;

  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.text) return content.text;
    }
  }

  throw new Error('OpenAI response did not contain generated text');
}

export async function generatePageWithAI({ siteName, businessDescription, pageType, language = 'fr' }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-5.5';
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: 'You are a senior website strategist and SEO copywriter. Return strict JSON only.'
        },
        {
          role: 'user',
          content: `Create a ${pageType} web page for ${siteName}. Business: ${businessDescription}. Language: ${language}. Return JSON with slug, title, metaTitle, metaDescription, markdown, html. HTML must be clean, responsive, without script tags, and suitable for embedding.`
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'generated_page',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              slug: { type: 'string' },
              title: { type: 'string' },
              metaTitle: { type: 'string' },
              metaDescription: { type: 'string' },
              markdown: { type: 'string' },
              html: { type: 'string' }
            },
            required: ['slug', 'title', 'metaTitle', 'metaDescription', 'markdown', 'html']
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed with status ${response.status}: ${errorBody}`);
  }

  return JSON.parse(extractOutputText(await response.json()));
}
