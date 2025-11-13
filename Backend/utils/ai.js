import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
  const supportAgent = createAgent({
    model: gemini({
      model: "gemini-2.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    }),
    name: "AI Ticket Triage Assistant",
    system: `You are an expert AI assistant that processes technical support tickets.\n\nYour job is to:\n1. Summarize the issue.\n2. Estimate its priority.\n3. Provide helpful notes and resource links for human moderators.\n4. List relevant technical skills required.\n\nIMPORTANT:\n- Respond with *only* valid raw JSON.\n- Do NOT include markdown, code fences, comments, or any extra formatting.\n- The format must be a raw JSON object.\nRepeat: Do not wrap your output in markdown or code fences.`,
  });

  const response = await supportAgent.run(`You are a ticket triage agent. Only return a strict JSON object with no extra text, headers, or markdown.\n\nAnalyze the following support ticket and provide a JSON object with:\n- summary: A short 1-2 sentence summary of the issue.\n- priority: One of "low", "medium", or "high".\n- helpfulNotes: A detailed technical explanation that a moderator can use to solve this issue. Include useful external links or resources if possible.\n- relatedSkills: An array of relevant skills required to solve the issue (e.g., ["React", "MongoDB"]).\n\nYour response MUST start with '{' and end with '}'. Do not include any markdown, code fences, explanation, or extra formatting. Only output the JSON object.\n\nTicket information:\n- Title: ${ticket.title}\n- Description: ${ticket.description}`);

  let raw;
  if (response && response.output && response.output[0] && response.output[0].content) {
    raw = response.output[0].content;
  } else if (response && response.output && response.output[0] && response.output[0].context) {
    raw = response.output[0].context;
  } else if (response && response.output && typeof response.output === "string") {
    raw = response.output;
  } else {
    console.log("AI response missing expected output structure:", JSON.stringify(response));
    return null;
  }

  try {
    const match = raw.match(/```json\s*([\s\S]*?)\s*```/i);
    const jsonString = match ? match[1] : raw.trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.log("Failed to parse JSON from AI response: " + e.message);
    console.log("Raw AI response:", raw);
    return null;
  }
}

export default analyzeTicket;
