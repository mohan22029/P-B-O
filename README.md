# PBM Optimize - Pharmacy Benefit Management Platform

A comprehensive AI-powered PBM optimization platform designed to reduce pharmacy costs by 12% while maintaining 95%+ member satisfaction with drug access.

## 🎯 Project Overview

**Objective:** Optimize formulary decisions and drug utilization to control pharmacy costs while ensuring appropriate medication access.

**Key Goals:**
- Reduce pharmacy costs by ≥12%
- Maintain ≥95% member access satisfaction
- Real-time formulary impact analysis
- Therapeutic equivalence optimization
- Drug utilization trend prediction
- Cost-per-member-per-month (PMPM) tracking
- AI-powered drug recommendations
- Sentiment analysis of drug reviews
- Predictive cost forecasting

## 🏗️ Architecture

### Frontend Stack
- **React** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom healthcare design system
- **shadcn/ui** components for consistent UI
- **Recharts** for data visualization
- **React Router** for navigation

### Backend Stack
- **Flask** for API server
- **Python** with ML libraries (scikit-learn, LightGBM, transformers)
- **NLP** for drug interaction analysis
- **Pandas** for data processing

### Design System
Professional healthcare industry-inspired design featuring:
- Healthcare blue/green color palette (`hsl(210, 100%, 45%)` primary)
- Tier-specific color coding for formulary entries
- Semantic tokens for consistent theming
- Responsive layouts optimized for healthcare workflows

## 📊 Key Features

### 1. Executive Dashboard
- Real-time PMPM tracking and trends
- Cost reduction progress monitoring
- Member access score visualization
- Generic fill rate analytics
- Utilization forecasting by drug category
- **AI Drug Recommendation Engine** with ML-powered suggestions
- Real-time cost savings analysis
- Interactive drug search and recommendation

- **Live integration with ML model**
- Export functionality
- Step therapy protocols
### 3. Sentiment Analysis Module
- AI-powered sentiment analysis of drug reviews
- Patient feedback aggregation
- Therapeutic class sentiment comparison
- Risk identification based on negative sentiment
- Visual sentiment distribution charts
- Real-time impact analysis for changes
### 4. Predictive Forecasting
- ML-powered cost forecasting (3, 6, 12 months)
- Trend analysis and risk assessment
- Confidence intervals for predictions
- Budget planning support
- Early warning system for cost increases

### 5. Therapeutic Equivalence (TE) Engine
- AB-rated generic identification
- Cost savings calculation per switch
- Confidence scoring for recommendations
- Batch optimization capabilities

### 6. Scenario Analysis
- What-if modeling for formulary changes
- ROI calculation and projections
- Member disruption impact assessment
- Access score maintenance validation

### 7. Provider Analytics
- Prescriber performance scorecards
- Cost efficiency metrics
- Generic prescribing rates
- Targeted intervention recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Your drug dataset in CSV format

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pbm-optimize
```

2. **Install Frontend Dependencies**
```bash
npm install
```

3. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

4. **Setup Your Dataset**
- Place your CSV file in `backend/data/testtt01.csv`
- Ensure it has the required columns: ndc, drug_name, generic_name, therapeutic_class, pmpm_cost, etc.

5. **Start the Backend Server**
```bash
cd backend
python server.py
```

6. **Start the Frontend Development Server**
```bash
npm run dev
```

7. **Access the Application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

## 🗂️ File Structure

```
src/
├── components/
│   ├── layout/           # AppLayout, Sidebar, Header
│   ├── dashboard/        # KPICard, ImpactWidget, TierBadge
│   └── ui/              # shadcn/ui components
├── pages/
│   ├── SentimentAnalysis.tsx  # Drug sentiment analysis
│   ├── Forecasting.tsx  # Predictive cost forecasting
│   ├── Dashboard.tsx     # Executive overview
│   ├── Formulary.tsx     # Drug management
│   ├── Scenarios.tsx     # What-if analysis
│   └── Providers.tsx     # Prescriber insights
├── lib/
│   ├── api.ts           # Backend API integration
│   └── utils.ts         # Utility functions
├── types/
│   └── pbm.ts           # TypeScript domain models
└── index.css           # Design system tokens

backend/
├── server.py           # Flask API server
├── app.py             # ML model logic
├── requirements.txt   # Python dependencies
└── data/             # Dataset storage
```

## 🤖 ML Model Features

### Drug Recommendation Engine
- **NLP-powered interaction analysis** using BART-large-mnli
- **LightGBM regression model** for recommendation scoring
- **Therapeutic equivalence validation**
- **Cost optimization with safety constraints**
- **Real-time confidence scoring**

### Key ML Capabilities
1. **Interaction Risk Assessment**: NLP analysis of drug interactions
2. **Cost-Benefit Analysis**: ML-powered savings calculations
3. **Safety Scoring**: Automated risk assessment
4. **Therapeutic Equivalence**: AB-rated generic identification
5. **Confidence Intervals**: Statistical confidence in recommendations

## 🎨 Design System

### Color Palette
```css
/* Primary Healthcare Blue */
--primary: 210 100% 45%
--primary-light: 210 100% 55%
--primary-dark: 210 100% 35%

/* Healthcare Success Green */
--secondary: 142 76% 36%

/* Tier Colors */
--tier-preferred: 142 76% 36%      /* Green */
--tier-non-preferred: 45 93% 47%   /* Orange */
--tier-specialty: 271 81% 56%      /* Purple */
--tier-excluded: 0 84% 60%         /* Red */

/* Data Visualization */
--chart-1: 210 100% 45%            /* Blue */
--chart-2: 142 76% 36%             /* Green */
--chart-3: 25 95% 53%              /* Orange */
--chart-4: 271 81% 56%             /* Purple */
--chart-5: 348 83% 47%             /* Red */
```

### Typography
- Professional healthcare fonts
- Clear hierarchy for clinical data
- Monospace for NDC codes and IDs

## 📈 Key Metrics

### KPI Tracking
- **PMPM (Per-Member-Per-Month):** Primary cost metric
- **Cost Reduction %:** Progress toward 12% target
- **Member Access Score:** Satisfaction proxy (≥95% target)
- **Generic Fill Rate:** Cost optimization indicator

### Business Logic
```typescript
// PMMP Calculation
PMPM = total_pharmacy_spend / members_enrolled

// Access Score (proxy calculation)
AccessScore = 100% - (denied_claims% + PA_denials_weighted + step_therapy_friction)

// TE Savings Calculation  
TESavings = (brand_cost - generic_cost) * projected_utilization
```

## 🔧 Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check
```

## 🔌 API Endpoints

### Core Endpoints
- `GET /api/health` - Server health check
- `GET /api/drugs` - Get all drugs from dataset
- `GET /api/drug-stats` - Get statistical overview
- `POST /api/recommend` - Get ML recommendations
- `GET /api/cost-analysis` - Get cost analysis data
- `POST /api/add-drug` - Add new drug to dataset

### ML Integration
- Real-time model inference
- NLP-powered interaction analysis
- Confidence scoring
- Safety validation
- Access via sidebar navigation
- Search by NDC or drug name

### 3. TE Recommendations
- Automated generic alternative identification  
- Drag-and-drop formulary modifications
- Real-time ROI calculation
- Access score validation

## 🎨 UI Components

### Specialized Healthcare Components
- `KPICard`: Metric display with trend indicators
- `TierBadge`: Color-coded formulary tier display
- `ImpactWidget`: Change analysis with access validation
- Professional data tables with advanced filtering
- Clinical-grade charts and visualizations
- `RecommendationEngine`: AI-powered drug suggestions
- `SentimentChart`: Sentiment visualization components
- `ForecastChart`: Predictive analytics displays

## 📱 Responsive Design

Optimized for healthcare workflows across devices:

## 🔒 Security & Compliance

Built with healthcare data security in mind:
- No PHI storage in frontend
- Aggregated data presentation only
- Professional audit trails
- HIPAA-ready architecture foundations
- Secure API endpoints
- Data validation and sanitization

## 🚀 Production Deployment

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to your web server
```

### Backend Deployment
```bash
# Use gunicorn for production
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

### Environment Variables
- Set appropriate CORS origins for production
- Configure database connections if needed
- Set up logging and monitoring

---

**Technology Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Vite, Flask, Python, ML (LightGBM, Transformers)
**Industry Focus:** Pharmacy Benefit Management (PBM)  
**Target Users:** PBM Analysts, Healthcare Administrators, Pharmacy Directors
**AI Features:** Drug Recommendations, Sentiment Analysis, Cost Forecasting, NLP Interaction Analysis