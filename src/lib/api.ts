const API_BASE_URL = 'http://localhost:5000/api';

export interface Drug {
  ndc: string;
  drug_name: string;
  generic_name: string;
  atc_code: string;
  therapeutic_class: string;
  therapeutic_equivalence_code: string;
  patent_expiration_date?: string;
  total_prescription_fills: number | string;
  total_drug_cost: number | string;
  pmpm_cost: number;
  member_count: number | string;
  avg_age: number;
  state: string;
  drug_interactions: string;
  clinical_efficacy: string;
  created_at: string;
  updated_at: string;
}

export interface DrugStats {
  total_drugs: number;
  total_cost: number;
  total_members: number;
  avg_pmpm: number;
  therapeutic_classes: number;
  states_covered: number;
  avg_age: number;
  te_codes_distribution: Record<string, number>;
}

export interface RecommendationRequest {
  drug_names: string[];
}

export interface RecommendationResponse {
  original_drugs: Drug[];
  recommended_drugs: Drug[];
  analysis: {
    type: 'single_drug' | 'combination';
    cost_saving_per_member?: number;
    total_cost_saving?: number;
    percentage_saving: number;
    interaction_risk?: number;
    interaction_description?: string;
    safety_score?: string;
    therapeutic_class_match?: boolean;
    generic_match?: boolean;
  };
}

export interface CostAnalysis {
  cost_by_therapeutic_class: Record<string, number>;
  pmpm_by_state: Record<string, number>;
  age_distribution: Record<string, number>;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async healthCheck() {
    return this.request<{
      status: string;
      model_loaded: boolean;
      data_loaded: boolean;
      nlp_available: boolean;
    }>('/health');
  }

  async getDrugs() {
    return this.request<{ drugs: Drug[]; total_count: number }>('/drugs');
  }

  async getDrugStats() {
    return this.request<DrugStats>('/drug-stats');
  }

  async getRecommendations(drugNames: string[]) {
    return this.request<RecommendationResponse>('/recommend', {
      method: 'POST',
      body: JSON.stringify({ drug_names: drugNames }),
    });
  }

  async getTherapeuticClasses() {
    return this.request<{
      therapeutic_classes: Array<{ name: string; count: number }>;
    }>('/therapeutic-classes');
  }

  async getCostAnalysis() {
    return this.request<CostAnalysis>('/cost-analysis');
  }

  async addDrug(drugData: Partial<Drug>) {
    return this.request<{ message: string; drug: Drug }>('/add-drug', {
      method: 'POST',
      body: JSON.stringify(drugData),
    });
  }
}

export const apiService = new ApiService();