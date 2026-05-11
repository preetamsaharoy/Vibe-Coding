import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SQLGraph {
  nodes: {
    id: string;
    label: string;
    type: "table" | "subquery" | "result";
    columns?: string[];
  }[];
  links: {
    source: string;
    target: string;
    label: string;
    type: "join" | "from" | "union";
  }[];
  explanation: string;
}

export async function parseSQLToGraph(sql: string): Promise<SQLGraph> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following SQL query and convert it into a graph structure for visualization. 
    Identify tables, subqueries, and how they relate via joins or FROM clauses.
    
    In the explanation field, provide a "working backwards" breakdown of the query in plain English. 
    Start by explaining the final result (the main SELECT), then work your way back through the joins, subqueries, and filters that lead to that result. Use clear, non-technical language where possible.
    
    SQL:
    ${sql}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["table", "subquery", "result"] },
                columns: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "label", "type"]
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                label: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["join", "from", "union"] }
              },
              required: ["source", "target", "label", "type"]
            }
          },
          explanation: { type: Type.STRING, description: "A 'working backwards' explanation of the query, starting from the final output and tracing back to the source data." }
        },
        required: ["nodes", "links", "explanation"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as SQLGraph;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Could not visualize this SQL. Please check the syntax.");
  }
}
