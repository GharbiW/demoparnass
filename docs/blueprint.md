# **App Name**: Parnass Platform

## Core Features:

- Data Ingestion and Normalization: Ingest data from various sources (Michelin CF, AS24, Vialtic, RNteCar, WinCPL, generic uploads) and normalize it into canonical data models, handling validation and DLQ processing.
- Dispatch Board: Display a real-time dispatch board with cards showing ETA, SLA status, and actions such as reassigning drivers/vehicles.
- Driver 360 View: Provide a comprehensive view of drivers, including profile, compliance, assignments, behavior, incidents, training, and AI-powered scores and risks.
- Vehicle 360 View: Offer a complete view of vehicles, including location, health, maintenance, AI-powered predictions, costs, and compliance documents.
- Anomaly Detection and Alerting: Detect anomalies based on predefined thresholds (e.g., fuel exceptions, HOS breaches, compliance expiry) and trigger alerts routed to relevant roles (dispatcher, fleet_manager, HR).
- Predictive Maintenance: Predict potential vehicle failures and recommend maintenance actions using AI, including estimating ETTF (Estimated Time To Failure) and component health gauges. This features generates work orders when thresholds are met. A reasoning tool will analyze a range of vehicle parameters to estimate these predictions.
- AI-Powered Trip Risk Assessment: Assess the risk of ETA breaches, route deviations, and cold chain drifts for ongoing trips using AI. Offer proactive recommendations, and present reasoning for the risk assessments. A reasoning tool analyzes parameters like planned route, historical data, traffic and weather in its determination.

## Style Guidelines:

- Primary color: Deep blue (#1A237E), evoking trust, reliability, and stability, aligned with the transport sector.
- Background color: Very light gray (#F5F5F5), provides a clean, neutral backdrop for content.
- Accent color: Vibrant orange (#FF9800), used for call-to-action buttons and important highlights to draw user attention.
- Body and headline font: 'Inter', a grotesque-style sans-serif, to maintain a modern, machined, neutral and objective appearance that offers legibility in various interfaces
- Code font: 'Source Code Pro' for displaying code snippets or technical information.
- Use clear and recognizable icons related to transportation and logistics.
- Employ a modular design with cards and well-defined sections to maintain order.