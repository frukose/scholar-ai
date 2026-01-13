
export enum ResearchMode {
  SYNTHESIS = 'SYNTHESIS',
  LIT_REVIEW = 'LIT_REVIEW',
  CRITICAL_ANALYSIS = 'CRITICAL_ANALYSIS',
  HYPOTHESIS_GEN = 'HYPOTHESIS_GEN'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ResearchResponse {
  query?: string;
  content: string;
  sources: GroundingSource[];
  timestamp: string;
  imageUrl?: string;
}

export interface SessionState {
  history: ResearchResponse[];
  isLoading: boolean;
  error: string | null;
}
