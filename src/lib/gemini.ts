export async function askGemini(
  prompt: string,
  system?: string,
  model = 'gemini-3.6-flash'
): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      system:
        system ||
        'You are StudyMate AI Tutor. Be clear, accurate, and structured. Answer the student directly.',
      model,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'API route not found. Ensure api/gemini.js is in the repo and the project is imported on Vercel.'
      );
    }
    throw new Error(data.error || `API error ${res.status}`);
  }

  if (!data.text) {
    throw new Error('Empty AI response');
  }

  return data.text;
}
