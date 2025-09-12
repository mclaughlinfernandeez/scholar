import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { from, map, Observable } from 'rxjs';
import { AnalysisResult, ResearchSource } from '../models/types';

declare var process: any;

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (typeof process === 'undefined' || !process.env?.API_KEY) {
      console.error("API_KEY is not available. Using mock service.");
      this.ai = null as any; 
    } else {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }

  private getMockAnalysis(): AnalysisResult {
    return {
      markers: ['rs12345', 'chr1:123456'],
      phenotypes: ['Cardiovascular Disease', 'Type 2 Diabetes'],
      research_areas: ['Lipid Metabolism', 'Pharmacogenomics'],
    };
  }

  analyzeContent(fileContent: string): Observable<AnalysisResult> {
    if (!this.ai) {
      console.warn('Gemini AI not initialized. Returning mock analysis.');
      return new Observable(observer => {
        setTimeout(() => {
          observer.next(this.getMockAnalysis());
          observer.complete();
        }, 1000);
      });
    }

    const promise = this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following genomics data snippet. Extract key genetic markers (like rsIDs or chromosome positions), associated phenotypes, and broad research areas. The data could be from a VCF, CSV, or plain text file. Snippet: "${fileContent.substring(0, 2000)}". Return ONLY a valid JSON object with keys: "markers", "phenotypes", and "research_areas". Do not include any other text or markdown formatting.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            markers: { type: Type.ARRAY, items: { type: Type.STRING } },
            phenotypes: { type: Type.ARRAY, items: { type: Type.STRING } },
            research_areas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    return from(promise).pipe(
      map((response: GenerateContentResponse) => {
        try {
          return JSON.parse(response.text) as AnalysisResult;
        } catch (e) {
          console.error("Failed to parse Gemini analysis response:", e);
          console.error("Raw response:", response.text);
          return this.getMockAnalysis();
        }
      })
    );
  }
  
  private getMockReport(): string {
      return `## Comprehensive Genomic Analysis Report\n\n### Introduction\nThis report, generated via mock data due to a missing API key, synthesizes findings from uploaded genomic data and selected literature. It outlines potential genetic associations and avenues for future research based on mock analysis of markers like rs12345 and phenotypes including Cardiovascular Disease.\n\n### Detailed Analysis\nThe mock data suggests a strong link between the rs12345 variant and an increased risk for Cardiovascular Disease. Literature from the mock GWAS Catalog supports this association, pointing to pathways involved in lipid metabolism. The selected Semantic Scholar articles further elaborate on the potential for developing Polygenic Risk Scores (PRS) to better stratify patient risk.\n\n### Synthesis and Implications\nCombining the user-provided data with the selected sources paints a picture of a complex genetic architecture underlying Cardiovascular Disease. The findings underscore the importance of integrating multi-omics data for a holistic understanding. The optional JSON knowledge provided by the user (mocked) highlighted a family history, further strengthening the case for genetic predisposition.\n\n### Conclusion\nThis synthesized analysis provides a foundation for further investigation. Future work should focus on validating these findings in larger cohorts and exploring the functional mechanisms of the identified variants. This mock report demonstrates the potential of AI-driven analysis to accelerate genomic research.`;
  }

  generateReport(
    fileContent: string,
    knowledge: any,
    sources: ResearchSource[]
  ): Observable<string> {
    if (!this.ai) {
      console.warn('Gemini AI not initialized. Returning mock report.');
      return new Observable(observer => {
        setTimeout(() => {
          observer.next(this.getMockReport());
          observer.complete();
        }, 2500);
      });
    }
      
    const sourcesText = sources
      .map(s => `Title: ${s.title}\nSummary: ${s.summary}`)
      .join('\n\n');

    const prompt = `You are a bioinformatics research assistant. Using the following user-provided data summary, existing knowledge, and selected research papers, generate a comprehensive and detailed report of at least 800 words. The report must synthesize the information, discuss potential implications, and suggest future research directions. Structure it with a title, an introduction, detailed analysis sections for each key finding, a synthesis of all information, and a conclusion. Use markdown for formatting. Be thorough and academic in tone.

      **User Data Snippet:**
      \`\`\`
      ${fileContent.substring(0, 1000)}
      \`\`\`

      **Existing Knowledge Provided by User:**
      \`\`\`json
      ${JSON.stringify(knowledge, null, 2)}
      \`\`\`

      **Selected Research Sources:**
      ${sourcesText}
    `;

    const promise = this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return from(promise).pipe(
      map((response: GenerateContentResponse) => response.text)
    );
  }
}
