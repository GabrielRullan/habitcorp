/**
 * Goblin Brain Service
 * ADHD Executive Function Micro-Step Generator ("Wall of Awful" Demolisher)
 * Supports Google Gemini API (gemini-2.0-flash / gemini-1.5-flash) and instant offline heuristics.
 */

const GEMINI_KEY_STORAGE = 'cadence_gemini_api_key';

export function getGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  } else {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  }
}

export function clearGeminiApiKey(): void {
  setGeminiApiKey('');
}

/**
 * Heuristic offline micro-step decomposition for instant zero-latency responses
 */
export function decomposeOffline(title: string, notes: string = ''): string[] {
  const text = `${title} ${notes}`.toLowerCase();

  // 1. Emails / Slack / Messaging
  if (/email|mail|message|reply|text|write back|slack|respond/.test(text)) {
    return [
      'Open your email or messaging app in a fresh window',
      'Paste the recipient address or open the thread',
      'Type just the greeting: "Hi [Name], quick update:"',
      'Write 1 single sentence answering the most important question',
      'Press Send, or step away for 2 minutes to breathe',
    ];
  }

  // 2. Cleaning / Chores / Organizing
  if (/clean|tidy|laundry|dishes|trash|room|desk|organize|kitchen/.test(text)) {
    return [
      'Stand up from your chair and roll your shoulders',
      'Pick up exactly 1 single piece of trash or 1 dirty mug',
      'Place it in the bin or kitchen sink',
      'Set a timer for 3 minutes and see how many items you put away',
      'Stop when the timer rings with full permission to be done',
    ];
  }

  // 3. Writing / Documentation / Creative
  if (/write|doc|article|essay|report|post|readme|draft|notes/.test(text)) {
    return [
      'Open a blank document or editor tab',
      'Type just the working title and your name at the top',
      'Jot down 3 messy bullet points (spelling mistakes fully allowed)',
      'Expand bullet #1 into two sentences',
      'Decide if you want to stop here or write one more line',
    ];
  }

  // 4. Programming / Coding / Debugging
  if (/code|bug|fix|refactor|test|feature|api|component|git|pr|merge|review/.test(text)) {
    return [
      'Open your editor and navigate to the relevant file',
      'Write a comment describing the single problem in plain English',
      'Create an empty test function or log a single variable',
      'Run the test/dev server once to see it fail or print',
      'Write the first 2 lines of the solution',
    ];
  }

  // 5. Phone Calls / Appointments
  if (/call|phone|dentist|doctor|schedule|appointment|book/.test(text)) {
    return [
      'Find the phone number and write it on a sticky note or copy it',
      'Write down the 1 question you need to ask: "Do you have openings this week?"',
      'Open your calendar so you can see your week at a glance',
      'Dial the number and put on speakerphone',
      'Take a sip of water while waiting for an answer',
    ];
  }

  // 6. Admin / Finances / Taxes / Invoices
  if (/tax|invoice|bill|bank|finance|pay|receipt|form|portal|bureaucracy/.test(text)) {
    return [
      'Close distracting browser tabs so only your desktop is visible',
      'Log into the portal or open the folder containing the document',
      'Download or open the single file you need to review',
      'Fill in only your Name and today’s Date',
      'Take a deep breath — the hardest part (starting) is done',
    ];
  }

  // 7. General / Default Momentum Ladder
  return [
    `Sit down and clear 1 square foot of space in front of you`,
    `Open the single application or tool needed for "${title.slice(0, 30)}"`,
    `Do the easiest 30-second sub-action (e.g. title the file, write 1 word)`,
    `Take a sip of water and celebrate cracking the Wall of Awful`,
    `Choose: continue for 5 minutes or pause without any guilt`,
  ];
}

/**
 * Decompose a task using Google Gemini API if configured, or offline heuristics
 */
export async function decomposeTask(
  title: string,
  notes: string = ''
): Promise<{ steps: string[]; source: 'gemini' | 'offline' }> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      steps: decomposeOffline(title, notes),
      source: 'offline',
    };
  }

  try {
    const prompt = `You are Goblin Brain, an expert ADHD Executive Function coach.
The user is facing severe executive dysfunction and is paralyzed in front of the "Wall of Awful" for this task:
Title: "${title}"
${notes ? `Notes: "${notes}"` : ''}

Break this task down into 3 to 5 ridiculously small, concrete, physical micro-actions.
CRITICAL RULES FOR ADHD BRAINS:
1. Step 1 MUST take under 30 seconds and be an effortless physical movement (e.g. "Open Chrome and type the URL", "Pick up 1 mug", "Put on right shoe").
2. No abstract steps like "research options" or "plan strategy" — use tangible verbs.
3. Keep each step under 12 words.
4. The final step must include permission to pause or celebrate having started.
5. Return ONLY a valid JSON array of strings, without code fences or extra text, e.g.:
["Step 1...", "Step 2...", "Step 3...", "Step 4..."]`;

    // Try Gemini 2.0 Flash, fallback to 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}. Falling back to Goblin Brain heuristics.`);
      return { steps: decomposeOffline(title, notes), source: 'offline' };
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Strip markdown code fences if model returned them
    const cleanJson = rawText.replace(/^```(json)?\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (Array.isArray(parsed) && parsed.length > 0) {
      const validSteps = parsed.filter((s) => typeof s === 'string' && s.trim().length > 0);
      if (validSteps.length > 0) {
        return { steps: validSteps, source: 'gemini' };
      }
    }

    return { steps: decomposeOffline(title, notes), source: 'offline' };
  } catch (err) {
    console.warn('Goblin Brain Gemini error, using offline heuristic:', err);
    return { steps: decomposeOffline(title, notes), source: 'offline' };
  }
}
