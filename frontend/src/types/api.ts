// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
}

// Generation types
export interface GenerationRequest {
  prompt: string;
  num_images: number;
  model?: string;
}

export interface GenerationResponse {
  job_id: string;
}

export interface Prediction {
  prediction_id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  urls: string[];
  error?: string;
  data_removed?: boolean;
  note?: string;
}

export interface GenerationJob {
  job_id: string;
  prompt: string;
  num_images: number;
  model: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  created_at: string;
  completed_at?: string;
  predictions: Prediction[];
  completed_images: number;
  failed_images: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'prediction_update' | 'pong' | 'error';
  data: any;
}

export interface PredictionUpdate {
  type: 'prediction_update';
  data: Prediction;
}

// API Error type
export interface ApiError {
  detail: string;
  status?: number;
}

// Models
export interface AvailableModels {
  models: string[];
  default_model: string;
}

export default {};
