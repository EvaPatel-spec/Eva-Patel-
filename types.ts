
export interface User {
  username: string;
  email: string;
  avatar: string;
  reputation: number;
}

export enum DetectionType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  ACADEMIC = 'ACADEMIC',
  CODE = 'CODE',
  EMAILS = 'EMAILS',
  CREATIVE = 'CREATIVE'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: DetectionType;
  input: string;
  result: 'TRUE' | 'FAKE' | 'AI_GENERATED' | 'HUMAN_WRITTEN' | 'UNCERTAIN';
  confidence: number;
  explanation: string;
}

export interface VerificationResult {
  status: 'TRUE' | 'FAKE' | 'AI_GENERATED' | 'HUMAN_WRITTEN' | 'UNCERTAIN';
  confidence: number;
  analysis: string;
  sources?: string[];
  metrics?: {
    perplexity?: string;
    burstiness?: string;
    readability?: string;
  };
}

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  comment: string;
  rating: number;
  timestamp: number;
}
