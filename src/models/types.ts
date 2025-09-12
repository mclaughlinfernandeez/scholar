export interface ResearchSource {
  id: string;
  type: 'GWAS' | 'Semantic Scholar';
  title: string;
  summary: string;
  link: string;
  markers?: string[];
  authors?: string[];
}

export interface AnalysisResult {
  markers: string[];
  phenotypes: string[];
  research_areas: string[];
}

export type AppState =
  | { status: 'initial' }
  | { status: 'comparing'; fileName: string; }
  | { status: 'comparisonReady'; fileName: string; comparisonFile: { blob: Blob, name: string }; }
  | { status: 'analyzing'; fileName: string; }
  | { status: 'fetchingSources'; fileName: string; analysis: AnalysisResult; }
  | { status: 'sourcesReady'; fileName: string; analysis: AnalysisResult; sources: ResearchSource[]; }
  | { status: 'generatingReport'; selectedSources: ResearchSource[]; }
  | { status: 'reportReady'; report: string; }
  | { status: 'error'; message: string; };