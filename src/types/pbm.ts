// PBM Domain Types - Matching Excel schema requirements

export interface Prescriber {
  npi: string;
  prescriber_name: string;
  specialty: string;
  state: string;
  total_claims: number;
  total_cost: number;
  unique_beneficiaries: number;
}

export interface Claim {
  claim_id: string;
  member_id: string;
  date: string;
  ndc: string;
  drug_name: string;
  qty: number;
  days_supply: number;
  ingredient_cost: number;
  final_paid_amount: number;
  prescriber_npi: string;
}

export interface Member {
  member_id: string;
  dob: string;
  gender: 'M' | 'F';
  plan_id: string;
  zip: string;
  risk_score: number;
}

export interface FormularyEntry {
  ndc: string;
  drug_name: string;
  tier: 'Preferred' | 'Non-Preferred' | 'Specialty' | 'Excluded';
  pa_required: boolean;
  step_therapy: string | null;
  copay: number;
}

export interface Rebate {
  ndc: string;
  manufacturer: string;
  rebate_per_unit: number;
}

export interface TEEquivalence {
  rxcui: string;
  ndc: string;
  brand: string;
  generic: string;
  atc: string;
  te_code: string;
  reference_ndc: string;
}

export interface Enrollment {
  month: string;
  members_enrolled: number;
}

export interface Satisfaction {
  month: string;
  csat_percent: number;
}

// Business Logic Types
export interface KPIMetrics {
  pmpm: number;
  pmpm_trend: number;
  cost_reduction_percent: number;
  member_access_percent: number;
  generic_fill_rate: number;
  total_spend: number;
  members_enrolled: number;
}

export interface ScenarioRequest {
  name: string;
  switches: Array<{
    from_ndc: string;
    to_ndc: string;
  }>;
  tier_changes: Array<{
    ndc: string;
    tier: FormularyEntry['tier'];
  }>;
  pa_rules: Array<{
    ndc: string;
    pa_required: boolean;
  }>;
  constraints: {
    min_access: number;
    max_disruption_pct: number;
  };
}

export interface ScenarioResult {
  scenario_name: string;
  projected_savings: number;
  new_pmpm: number;
  access_score: number;
  disruption_score: number;
  affected_members: number;
  roi_percentage: number;
}

export interface TERecommendation {
  current_ndc: string;
  current_drug: string;
  recommended_ndc: string;
  recommended_drug: string;
  potential_savings: number;
  savings_per_member: number;
  te_code: string;
  confidence_score: number;
}