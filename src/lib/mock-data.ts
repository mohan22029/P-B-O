import { FormularyEntry } from "@/types/pbm";

export interface DrugDetails {
  ndc: string;
  drug_name: string;
  generic_name: string;
  atc_code: string;
  therapeutic_class: string;
  therapeutic_equivalence_code: string | null;
  patent_expiration_date: string | null;
  total_prescription_fills: number | string;
  total_drug_cost: number | string;
  pmpm_cost: number | string;
  member_count: number | string;
  avg_age: number;
  state: string;
  drug_interactions: string;
  clinical_efficacy: string;
  created_at: string;
  updated_at: string;
}

export const mockDrugDetails: DrugDetails[] = [
  {
    ndc: "0186-0702-10",
    drug_name: "Uceris",
    generic_name: "BUDESONIDE",
    atc_code: "A07EA06",
    therapeutic_class: "Anti-Inflammatory Agents",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2043-01-23",
    total_prescription_fills: "3,500",
    total_drug_cost: "$150,000",
    pmpm_cost: "$35.71",
    member_count: 350,
    avg_age: 35,
    state: "CA",
    drug_interactions: "CYP3A4 inhibitors increase budesonide (H02AB02)",
    clinical_efficacy: "45–69% clinical improvement at 8 weeks in Crohn's disease trials",
    created_at: "2024-01-15",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0998-0635-05",
    drug_name: "METHYLPREDNISOLONE",
    generic_name: "Prednisolone",
    atc_code: "A07EA01",
    therapeutic_class: "Anti-Inflammatory Agents",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2019-11-24",
    total_prescription_fills: "3,200",
    total_drug_cost: "$20,000",
    pmpm_cost: "$2.50",
    member_count: 800,
    avg_age: 32,
    state: "TX",
    drug_interactions: "Concomitant anti-infectives recommended, corticosteroids effects (H02AB06)",
    clinical_efficacy: "Effective for ocular inflammation; intraocular pressure monitored with prolonged use",
    created_at: "2024-02-10",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0049-3420-30",
    drug_name: "FLUCONAZOLE",
    generic_name: "fluconazole",
    atc_code: "D01AC15",
    therapeutic_class: "Antifungal Agents",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: null,
    total_prescription_fills: "12,500",
    total_drug_cost: "$120,000",
    pmpm_cost: "$16.00",
    member_count: 750,
    avg_age: 65,
    state: "FL",
    drug_interactions: "Moderate CYP3A4 inhibitor, tacrolimus interaction (L04AD01)",
    clinical_efficacy: "Vaginal candidiasis 55% therapeutic cure rate",
    created_at: "2024-03-01",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0093-0840-30",
    drug_name: "Ketoderm",
    generic_name: "Ketoconazole",
    atc_code: "D01AC08",
    therapeutic_class: "Antifungal Agents",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2020-11-24",
    total_prescription_fills: "4,000",
    total_drug_cost: "$65,000",
    pmpm_cost: "$13.54",
    member_count: 480,
    avg_age: 40,
    state: "NY",
    drug_interactions: "Minimal systemic absorption, no significant interactions (D01AC08)",
    clinical_efficacy: "Clinical improvement seen early; 95% tolerated well",
    created_at: "2024-04-12",
    updated_at: "2025-08-21",
  },
  {
    ndc: "50458-290-01",
    drug_name: "Tolsura",
    generic_name: "itraconazole",
    atc_code: "J02AC02",
    therapeutic_class: "Antifungal Agents",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2033-06-21",
    total_prescription_fills: "3,000",
    total_drug_cost: "$250,000",
    pmpm_cost: "$83.33",
    member_count: 250,
    avg_age: 30,
    state: "IL",
    drug_interactions: "Potent CYP3A4 inhibitor, statin interactions (C10AA)",
    clinical_efficacy: "Systemic fungal infections 63% clinical response rate",
    created_at: "2024-05-18",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0469-3051-30",
    drug_name: "AMBISOME",
    generic_name: "Amphotericin B",
    atc_code: "A07AA07",
    therapeutic_class: "Antibiotics",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2019-06-18",
    total_prescription_fills: "3,900",
    total_drug_cost: "$310,000",
    pmpm_cost: "$51.67",
    member_count: 500,
    avg_age: 39,
    state: "PA",
    drug_interactions: "Nephrotoxic drugs potentiation (C01AA, H02AB)",
    clinical_efficacy: "Empirical febrile neutropenia 49.9% success rate",
    created_at: "2024-06-03",
    updated_at: "2025-08-21",
  },
  {
    ndc: "52015-080-01",
    drug_name: "Dificid",
    generic_name: "Fidaxomicin",
    atc_code: "A07AA12",
    therapeutic_class: "Antibiotics",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2034-11-28",
    total_prescription_fills: "6,400",
    total_drug_cost: "$750,000",
    pmpm_cost: "$62.50",
    member_count: "1,000",
    avg_age: 64,
    state: "OH",
    drug_interactions: "P-gp substrate, cyclosporine increases levels (L04AD01)",
    clinical_efficacy: "CDAD clinical response 88% end-of-treatment rate",
    created_at: "2024-07-22",
    updated_at: "2025-08-21",
  },
  {
    ndc: "54868-0310-40",
    drug_name: "IBUPROFEN",
    generic_name: "IBUPROFEN",
    atc_code: "N02AJ23",
    therapeutic_class: "Analgesics",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2041-07-09",
    total_prescription_fills: "34,00,000",
    total_drug_cost: "$8,500,000",
    pmpm_cost: "$0.05",
    member_count: "1,40,00,000",
    avg_age: 34,
    state: "GA",
    drug_interactions: "NSAID, increases bleeding with warfarin (B01AA03)",
    clinical_efficacy: "Temporary relief of minor aches and pains",
    created_at: "2024-08-15",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0338-0280-10",
    drug_name: "LIDOCAINE",
    generic_name: "LIDOCAINE",
    atc_code: "S02DA01",
    therapeutic_class: "Analgesics",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2031-05-10",
    total_prescription_fills: "6,500",
    total_drug_cost: "$45,000",
    pmpm_cost: "$2.50",
    member_count: "1,500",
    avg_age: 65,
    state: "AZ",
    drug_interactions: "Amiodarone increases lidocaine levels (C01BD01)",
    clinical_efficacy: "49.9% empirical febrile neutropenia success rate",
    created_at: "2024-09-02",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0049-4900-30",
    drug_name: "ZOLOFT",
    generic_name: "SERTRALINE",
    atc_code: "N06AB06",
    therapeutic_class: "Antidepressive Agents Indicated for Depression",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2020-04-11",
    total_prescription_fills: "4,000",
    total_drug_cost: "$180,000",
    pmpm_cost: "$30.00",
    member_count: 500,
    avg_age: 40,
    state: "WA",
    drug_interactions: "CYP2D6 inhibitor, increases metoprolol levels (C07AB02)",
    clinical_efficacy: "MDD response 88% end-of-treatment rate",
    created_at: "2024-10-20",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0777-3105-30",
    drug_name: "Prozac",
    generic_name: "FLUOXETINE",
    atc_code: "N06CA03",
    therapeutic_class: "Antidepressive Agents Indicated for Depression",
    therapeutic_equivalence_code: "AB1",
    patent_expiration_date: "2017-03-24",
    total_prescription_fills: "6,500",
    total_drug_cost: "$250,000",
    pmpm_cost: "$26.04",
    member_count: 800,
    avg_age: 65,
    state: "MI",
    drug_interactions: "MAOIs risk fatal serotonin syndrome",
    clinical_efficacy: "Significantly better than placebo on HAM-D",
    created_at: "2024-11-05",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0173-0945-55",
    drug_name: "ACYCLOVIR",
    generic_name: "ACYCLOVIR",
    atc_code: "D06BB03",
    therapeutic_class: "Antivirals",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2030-06-16",
    total_prescription_fills: "3,700",
    total_drug_cost: "$35,000",
    pmpm_cost: "$2.92",
    member_count: "1,000",
    avg_age: 37,
    state: "VA",
    drug_interactions: "Probenecid increases acyclovir half-life significantly",
    clinical_efficacy: "Significantly reduces lesion healing duration",
    created_at: "2024-12-11",
    updated_at: "2025-08-21",
  },
  {
    ndc: "68382-1165-6",
    drug_name: "OSELTAMIVIR PHOSPHATE",
    generic_name: "OSELTAMIVIR PHOSPHATE",
    atc_code: "J05AH02",
    therapeutic_class: "Antivirals",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2015-08-27",
    total_prescription_fills: "3,400",
    total_drug_cost: "$150,000",
    pmpm_cost: "$15.63",
    member_count: 800,
    avg_age: 34,
    state: "MD",
    drug_interactions: "Avoid live attenuated influenza vaccine",
    clinical_efficacy: "Reduces median symptom duration by 1.3 days",
    created_at: "2025-01-08",
    updated_at: "2025-08-21",
  },
  {
    ndc: "53489-151-01",
    drug_name: "Tolinase",
    generic_name: "Tolazamide",
    atc_code: "A10BB05",
    therapeutic_class: "Blood Glucose Lowering Agents ",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: null,
    total_prescription_fills: "5,200",
    total_drug_cost: "$60,000",
    pmpm_cost: "$6.00",
    member_count: "1,000",
    avg_age: 52,
    state: "NC",
    drug_interactions: "CYP2C9 inhibitors increase hypoglycemia risk",
    clinical_efficacy: "Lowers HbA₁c by approximately 1–2%",
    created_at: "2025-02-14",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0049-1550-66",
    drug_name: "Segluromet",
    generic_name: "Glipizide",
    atc_code: "A10BB07",
    therapeutic_class: "Blood Glucose Lowering Agents ",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2019-03-26",
    total_prescription_fills: "5,900",
    total_drug_cost: "$85,000",
    pmpm_cost: "$7.08",
    member_count: "1,000",
    avg_age: 59,
    state: "GA",
    drug_interactions: "Miconazole coadministration increases hypoglycemia risk",
    clinical_efficacy: "Improves glycemic control in type 2",
    created_at: "2025-03-25",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0573-0427-04",
    drug_name: "Lasix",
    generic_name: "Furosemide",
    atc_code: "C03EB01",
    therapeutic_class: "Diuretics",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2034-04-03",
    total_prescription_fills: "5,600",
    total_drug_cost: "$30,000",
    pmpm_cost: "$5.00",
    member_count: 500,
    avg_age: 56,
    state: "FL",
    drug_interactions: "NSAIDs blunt furosemide diuretic effect",
    clinical_efficacy: "Rapidly reduces edema and lowers BP",
    created_at: "2025-04-01",
    updated_at: "2025-08-21",
  },
  {
    ndc: "52544-622-01",
    drug_name: "Accuretic",
    generic_name: "Hydrochlorothiazide",
    atc_code: "C09XA54",
    therapeutic_class: "Diuretics",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2044-01-23",
    total_prescription_fills: "6,200",
    total_drug_cost: "$75,000",
    pmpm_cost: "$8.33",
    member_count: 750,
    avg_age: 62,
    state: "TX",
    drug_interactions: "NSAIDs blunt diuretic and antihypertensive effect",
    clinical_efficacy: "Significantly lowers blood pressure versus placebo",
    created_at: "2025-05-15",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0054-5040-01",
    drug_name: "Rayos",
    generic_name: "Prednisone",
    atc_code: "A07EA03",
    therapeutic_class: "Corticosteroids",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2027-08-03",
    total_prescription_fills: "5,500",
    total_drug_cost: "$90,000",
    pmpm_cost: "$15.00",
    member_count: 500,
    avg_age: 55,
    state: "CA",
    drug_interactions: "CYP3A4 inducers reduce steroid efficacy",
    clinical_efficacy: "Rapidly suppresses inflammation and immune responses",
    created_at: "2025-06-05",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0009-0012-01",
    drug_name: "Ala-cort",
    generic_name: "Hydrocortisone",
    atc_code: "A07EA02",
    therapeutic_class: "Corticosteroids",
    therapeutic_equivalence_code: "AT",
    patent_expiration_date: "2034-05-12",
    total_prescription_fills: "3,200",
    total_drug_cost: "$40,000",
    pmpm_cost: "$6.67",
    member_count: 500,
    avg_age: 32,
    state: "NY",
    drug_interactions: "CYP3A4 inducers reduce glucocorticoid exposure",
    clinical_efficacy: "Restores cortisol levels and prevents adrenal crises",
    created_at: "2025-07-28",
    updated_at: "2025-08-21",
  },
  {
    ndc: "11523-0800",
    drug_name: "CLARITIN",
    generic_name: "LORATADINE",
    atc_code: "R06AX13",
    therapeutic_class: "Antihistamines",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2018-06-01",
    total_prescription_fills: "4,400",
    total_drug_cost: "$15,000",
    pmpm_cost: "$0.25",
    member_count: "5,000",
    avg_age: 44,
    state: "VA",
    drug_interactions: "CYP3A4/2D6 inhibitors can raise loratadine/desloratadine levels; clinically significant QT effects are not expected at recommended doses.",
    clinical_efficacy: "Once-daily loratadine 10 mg is superior to placebo for relieving seasonal allergic rhinitis symptoms .",
    created_at: "2025-08-01",
    updated_at: "2025-08-21",
  },
  {
    ndc: "69618-025-01",
    drug_name: "Benadryl",
    generic_name: "Diphenhydramine",
    atc_code: "D04AA33",
    therapeutic_class: "Antihistamines",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2022-05-30",
    total_prescription_fills: "4,700",
    total_drug_cost: "$22,000",
    pmpm_cost: "$0.50",
    member_count: "3,600",
    avg_age: 47,
    state: "MI",
    drug_interactions: "CNS depressants (e.g., alcohol, sedatives)",
    clinical_efficacy: "Allergy relief; motion sickness; some sleep aid",
    created_at: "2025-08-05",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0087-6060-05",
    drug_name: "METFORMIN HYDROCHLORIDE",
    generic_name: "Metformin",
    atc_code: "A10BD28",
    therapeutic_class: "Antidiabetics",
    therapeutic_equivalence_code: "AB1",
    patent_expiration_date: "2034-04-03",
    total_prescription_fills: "6,300",
    total_drug_cost: "$120,000",
    pmpm_cost: "$1.59",
    member_count: "6,300",
    avg_age: 63,
    state: "TX",
    drug_interactions: "Cationic drugs; Alcohol (lactic risk)",
    clinical_efficacy: "diabetes prevention; lowers insulin dose; weight neutral or loss",
    created_at: "2025-08-07",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0039-0221-10",
    drug_name: "Duetact",
    generic_name: "Glimepiride",
    atc_code: "A10BD04",
    therapeutic_class: "Antidiabetics",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2027-01-30",
    total_prescription_fills: "4,600",
    total_drug_cost: "$95,000",
    pmpm_cost: "$13.84",
    member_count: 550,
    avg_age: 46,
    state: "PA",
    drug_interactions: "Miconazole (severe hypo),  many glucose-affecting drugs",
    clinical_efficacy: "fasting and post-prandial glucose reductions",
    created_at: "2025-08-08",
    updated_at: "2025-08-21",
  },
  {
    ndc: "00093-1712-01",
    drug_name: "Jantoven",
    generic_name: "Warfarin",
    atc_code: "B01AA03",
    therapeutic_class: "Anticoagulants",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: null,
    total_prescription_fills: "3,400",
    total_drug_cost: "$15,000",
    pmpm_cost: "$0.78",
    member_count: "1,600",
    avg_age: 48,
    state: "PA",
    drug_interactions: "antibiotics; vitamin K/herbals; thyroid states; alcohol",
    clinical_efficacy: "reduces stroke/embolism; effective long-term anticoagulation",
    created_at: "2025-08-09",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0003-0894",
    drug_name: "APIXABAN",
    generic_name: "Apixaban",
    atc_code: "B01AF02",
    therapeutic_class: "Anticoagulants",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2041-05-22",
    total_prescription_fills: "6,900",
    total_drug_cost: "$350,000",
    pmpm_cost: "$41.67",
    member_count: 700,
    avg_age: 69,
    state: "IL",
    drug_interactions: "Strong CYP3A4 and P-gp inhibitors increase apixaban (B01AF02)",
    clinical_efficacy: "Reduces stroke risk by 21% vs warfarin, 60% lower major bleeding risk in AF trials",
    created_at: "2025-08-10",
    updated_at: "2025-08-21",
  },
  {
    ndc: "50458-300",
    drug_name: "Risvan",
    generic_name: "Risperidone",
    atc_code: "N05AX08",
    therapeutic_class: "Antipsychotics",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2040-09-11",
    total_prescription_fills: "4,200",
    total_drug_cost: "$85,000",
    pmpm_cost: "$8.85",
    member_count: 800,
    avg_age: 42,
    state: "CA",
    drug_interactions: "Carbamazepine reduces risperidone levels (N03AF01)",
    clinical_efficacy: "Effective in schizophrenia symptoms, 60-70% responders in trials",
    created_at: "2025-08-11",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0002-4115-30",
    drug_name: "Lybalvi",
    generic_name: "Olanzapine",
    atc_code: "N05AH53",
    therapeutic_class: "Antipsychotics",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2041-11-12",
    total_prescription_fills: "3,100",
    total_drug_cost: "$65,000",
    pmpm_cost: "$7.00",
    member_count: 775,
    avg_age: 31,
    state: "TX",
    drug_interactions: "Carbamazepine increases clearance (N03AF01)",
    clinical_efficacy: "Improved symptoms in schizophrenia, bipolar (over 60% responders in trials)",
    created_at: "2025-08-12",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0173-0442-02",
    drug_name: "Zuplenz",
    generic_name: "Ondansetron",
    atc_code: "A04AA01",
    therapeutic_class: "Antiemetics",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2030-07-13",
    total_prescription_fills: "5,500",
    total_drug_cost: "$120,000",
    pmpm_cost: "$16.67",
    member_count: 720,
    avg_age: 55,
    state: "FL",
    drug_interactions: "Carbamazepine reduces ondansetron exposure (N03AF01)",
    clinical_efficacy: "76% no emesis vs 46% placebo",
    created_at: "2025-08-13",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0091-3331-01",
    drug_name: "Gimoti",
    generic_name: "Metoclopramide",
    atc_code: "A03FA01",
    therapeutic_class: "Antiemetics",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2029-12-22",
    total_prescription_fills: "5,000",
    total_drug_cost: "$80,000",
    pmpm_cost: "$13.33",
    member_count: 500,
    avg_age: 50,
    state: "NY",
    drug_interactions: "Anticholinergics antagonize motility (A03AB)",
    clinical_efficacy: "Symptom relief in ~70% of patients",
    created_at: "2025-08-14",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0071-0155-23",
    drug_name: "Lipitor",
    generic_name: "Atorvastatin",
    atc_code: "C10AA05",
    therapeutic_class: "Statins",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2037-06-07",
    total_prescription_fills: "6,300",
    total_drug_cost: "$28,000",
    pmpm_cost: "$0.20",
    member_count: "11,500",
    avg_age: 63,
    state: "OH",
    drug_interactions: "Strong CYP3A4 inhibitors raise myopathy risk (J01FA09)",
    clinical_efficacy: "Reduced MI/stroke risk by 36%",
    created_at: "2025-08-15",
    updated_at: "2025-08-21",
  },
  {
    ndc: "60505-2888-9",
    drug_name: "Crestor",
    generic_name: "Rosuvastatin",
    atc_code: "C10AA07",
    therapeutic_class: "Statins",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2036-02-12",
    total_prescription_fills: "5,900",
    total_drug_cost: "$35,000",
    pmpm_cost: "$0.25",
    member_count: "11,600",
    avg_age: 59,
    state: "GA",
    drug_interactions: "Gemfibrozil increases myopathy risk (C10AB05)",
    clinical_efficacy: "LDL-C reduced ~50% at 20 mg",
    created_at: "2025-08-16",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0006-0277-54",
    drug_name: "Januvia",
    generic_name: "Sitagliptin",
    atc_code: "A10BH01",
    therapeutic_class: "Antidiabetics",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2040-10-23",
    total_prescription_fills: "5,500",
    total_drug_cost: "$400,000",
    pmpm_cost: "$40.00",
    member_count: 833,
    avg_age: 55,
    state: "TX",
    drug_interactions: "Gemfibrozil increases sitagliptin exposure (C10AB05)",
    clinical_efficacy: "A1C reduced ~0.7% monotherapy",
    created_at: "2025-08-17",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0173-0718-20",
    drug_name: "Advair",
    generic_name: "Salmeterol",
    atc_code: "R03AK06",
    therapeutic_class: "Respiratory Agents",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2040-12-19",
    total_prescription_fills: "4,000",
    total_drug_cost: "$50,000",
    pmpm_cost: "$4.17",
    member_count: "1,000",
    avg_age: 40,
    state: "PA",
    drug_interactions: "Ketoconazole increases fluticasone levels (J02AC02)",
    clinical_efficacy: "Improved pre-dose FEV1 by 9%",
    created_at: "2025-08-18",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0002-1434-80",
    drug_name: "Trulicity",
    generic_name: "Dulaglutide",
    atc_code: "A10BJ05",
    therapeutic_class: "Antidiabetics",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: null,
    total_prescription_fills: "5,700",
    total_drug_cost: "$1,200,000",
    pmpm_cost: "$100.00",
    member_count: "1,000",
    avg_age: 57,
    state: "CA",
    drug_interactions: "Sulfonylureas increase hypoglycemia risk (A10BC)",
    clinical_efficacy: '"HbA1c reduced ~1.4% vs placebo\n\n"',
    created_at: "2025-08-19",
    updated_at: "2025-08-21",
  },
  {
    ndc: "31722-664-30",
    drug_name: "Nexium",
    generic_name: "Esomeprazole",
    atc_code: "A02BC05",
    therapeutic_class: "Proton Pump Inhibitors",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2036-12-08",
    total_prescription_fills: "5,500",
    total_drug_cost: "$220,000",
    pmpm_cost: "$20.00",
    member_count: 917,
    avg_age: 55,
    state: "NY",
    drug_interactions: "pH-dependent absorption;",
    clinical_efficacy: "Reduces NSAID-ulcer risk (≥60 yr)",
    created_at: "2025-08-20",
    updated_at: "2025-08-21",
  },
  {
    ndc: "50458-578-30",
    drug_name: "Xarelto",
    generic_name: "Rivaroxaban",
    atc_code: "B01AF01",
    therapeutic_class: "Anticoagulants",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2039-07-31",
    total_prescription_fills: "7,000",
    total_drug_cost: "$850,000",
    pmpm_cost: "$83.33",
    member_count: 850,
    avg_age: 70,
    state: "FL",
    drug_interactions: "Bleeding risk",
    clinical_efficacy: "Prevents thrombosis, reduces VTE recurrence",
    created_at: "2025-08-20",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0777-3104-02",
    drug_name: "Prozac",
    generic_name: "Fluoxetine",
    atc_code: "N06AB03",
    therapeutic_class: "Antidepressants",
    therapeutic_equivalence_code: "AB",
    patent_expiration_date: "2017-11-29",
    total_prescription_fills: "6,300",
    total_drug_cost: "$120,000",
    pmpm_cost: "$12.50",
    member_count: 800,
    avg_age: 63,
    state: "TX",
    drug_interactions: "Serotonin syndrome, Bleeding risk",
    clinical_efficacy: "Improves depression, reduces OCD, controls bulimia, reduces panic",
    created_at: "2025-08-21",
    updated_at: "2025-08-21",
  },
  {
    ndc: "0597-0075-41",
    drug_name: "Spiriva",
    generic_name: "Tiotropium",
    atc_code: "R03BB04",
    therapeutic_class: "Respiratory Agents",
    therapeutic_equivalence_code: "NA",
    patent_expiration_date: "2027-09-12",
    total_prescription_fills: "6,400",
    total_drug_cost: "$1,500,000",
    pmpm_cost: "$130.21",
    member_count: 960,
    avg_age: 64,
    state: "CA",
    drug_interactions: "Avoid other anticholinergics",
    clinical_efficacy: "reduces exacerbations by ~14%",
    created_at: "2025-08-21",
    updated_at: "2025-08-21",
  },
];

// Calculate KPIs from actual drug data
const calculateKPIs = () => {
  const totalCost = mockDrugDetails.reduce((sum, drug) => {
    const cost = typeof drug.total_drug_cost === 'string' 
      ? parseFloat(drug.total_drug_cost.replace(/[$,]/g, '')) 
      : drug.total_drug_cost;
    return sum + cost;
  }, 0);

  const totalMembers = mockDrugDetails.reduce((sum, drug) => {
    const members = typeof drug.member_count === 'string' 
      ? parseInt(drug.member_count.replace(/,/g, ''))
      : drug.member_count;
    return sum + members;
  }, 0);

  const genericDrugs = mockDrugDetails.filter(drug => 
    drug.therapeutic_equivalence_code === 'AB' || 
    drug.therapeutic_equivalence_code === 'AB1'
  ).length;

  return {
    pmpm: totalCost / totalMembers * 12, // Annual PMPM
    pmpm_trend: -3.2,
    cost_reduction_percent: 8.5,
    member_access_percent: 96.8,
    generic_fill_rate: (genericDrugs / mockDrugDetails.length) * 100
  };
};

export const mockKPIs = calculateKPIs();

// PMMP Trend Data
export const mockPMMPData = [
  { month: 'Jan', pmpm: 95.2, target: 85.0, baseline: 98.5 },
  { month: 'Feb', pmpm: 92.8, target: 85.0, baseline: 98.5 },
  { month: 'Mar', pmpm: 91.3, target: 85.0, baseline: 98.5 },
  { month: 'Apr', pmpm: 89.7, target: 85.0, baseline: 98.5 },
  { month: 'May', pmpm: 88.9, target: 85.0, baseline: 98.5 },
  { month: 'Jun', pmpm: 89.45, target: 85.0, baseline: 98.5 }
];

// Generate utilization trends from therapeutic classes
const generateUtilizationTrends = () => {
  const classMap = new Map();
  
  mockDrugDetails.forEach(drug => {
    const className = drug.therapeutic_class;
    if (!classMap.has(className)) {
      classMap.set(className, []);
    }
    classMap.get(className).push(drug);
  });

  return Array.from(classMap.entries())
    .map(([category, drugs]) => ({
      category: category,
      current: drugs.length * 12, // Simulated current utilization
      projected: Math.round(drugs.length * 12 * (1 + Math.random() * 0.3)) // 0-30% growth
    }))
    .slice(0, 8); // Top 8 categories
};

export const mockUtilizationTrends = generateUtilizationTrends();

// Generate TE recommendations from actual drug data
const generateTERecommendations = () => {
  const brandDrugs = mockDrugDetails.filter(drug => 
    drug.drug_name !== drug.generic_name.toUpperCase() &&
    drug.therapeutic_equivalence_code !== 'NA'
  );

  return brandDrugs.slice(0, 5).map(drug => {
    const cost = typeof drug.total_drug_cost === 'string' 
      ? parseFloat(drug.total_drug_cost.replace(/[$,]/g, '')) 
      : drug.total_drug_cost;
    const members = typeof drug.member_count === 'string' 
      ? parseInt(drug.member_count.replace(/,/g, ''))
      : drug.member_count;
    
    return {
      current_drug: drug.drug_name,
      recommended_drug: `Generic ${drug.generic_name}`,
      potential_savings: Math.round(cost * 0.6), // 60% savings estimate
      confidence_score: drug.therapeutic_equivalence_code === 'AB' ? 95 : 85,
      affected_members: members
    };
  });
};

export const mockTERecommendations = generateTERecommendations();

// Generate formulary entries from drug data
const generateFormularyEntries = () => {
  return mockDrugDetails.slice(0, 25).map(drug => {
    const cost = typeof drug.total_drug_cost === 'string' 
      ? parseFloat(drug.total_drug_cost.replace(/[$,]/g, '')) 
      : drug.total_drug_cost;
    
    let tier: FormularyEntry['tier'];
    let copay: number;
    let pa_required: boolean;
    
    // Determine tier based on cost and therapeutic equivalence
    if (drug.therapeutic_equivalence_code === 'AB' || drug.therapeutic_equivalence_code === 'AB1') {
      tier = 'Preferred';
      copay = 10;
      pa_required = false;
    } else if (cost > 100000) {
      tier = 'Specialty';
      copay = 150;
      pa_required = true;
    } else if (cost > 50000) {
      tier = 'Non-Preferred';
      copay = 45;
      pa_required = true;
    } else {
      tier = 'Preferred';
      copay = 20;
      pa_required = false;
    }

    return {
      ndc: drug.ndc,
      drug_name: drug.drug_name,
      tier,
      pa_required,
      step_therapy: pa_required ? 'Prior authorization required' : null,
      copay
    };
  });
};

export const mockFormulary: FormularyEntry[] = generateFormularyEntries();

// Generate prescriber data based on states and specialties from drug data
const generatePrescriberData = () => {
  const states = [...new Set(mockDrugDetails.map(drug => drug.state))];
  const specialtyMap = {
    'Cardiology': ['Statins', 'Anticoagulants'],
    'Endocrinology': ['Antidiabetics', 'Blood Glucose Lowering Agents'],
    'Psychiatry': ['Antidepressants', 'Antipsychotics'],
    'Internal Medicine': ['Antibiotics', 'Analgesics'],
    'Pulmonology': ['Respiratory Agents'],
    'Gastroenterology': ['Proton Pump Inhibitors', 'Antiemetics']
  };

  return Object.entries(specialtyMap).map(([specialty, _], index) => {
    const state = states[index % states.length];
    const baseClaims = 1500 + Math.random() * 2000;
    const costPerClaim = 25 + Math.random() * 150;
    
    return {
      npi: `${1234567890 + index}`,
      prescriber_name: `Dr. ${['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Anderson'][index]}`,
      specialty,
      state,
      total_claims: Math.round(baseClaims),
      total_cost: Math.round(baseClaims * costPerClaim),
      unique_beneficiaries: Math.round(baseClaims * 0.3),
      generic_rate: 70 + Math.random() * 25,
      cost_per_claim: Math.round(costPerClaim * 100) / 100
    };
  });
};

export const mockPrescribers = generatePrescriberData();

// Scenario Results Data
export const mockScenarioResults = [
  {
    scenario_name: 'Generic Switch Initiative',
    projected_savings: 2400000,
    pmpm_impact: -12.5,
    new_pmpm: 76.95,
    access_score: 96.2,
    roi_percentage: 85.5,
    affected_members: 15000,
    implementation_date: '2025-01-01'
  },
  {
    scenario_name: 'Tier Optimization',
    projected_savings: 1800000,
    pmpm_impact: -9.8,
    new_pmpm: 79.65,
    access_score: 95.8,
    roi_percentage: 72.3,
    affected_members: 8500,
    implementation_date: '2025-02-01'
  }
];