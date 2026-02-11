# Conception Module - Compliance Check vs Specs

## 📋 ECRAN PLANNING GLOBAL

### ✅ IMPLEMENTED FEATURES

#### Header (Zone A)
- ✅ Period selector: Jour / Semaine
- ✅ View toggles: Gantt | Liste
- ✅ Resource view: Véhicules | Chauffeurs
- ✅ Zoom levels: 15min / 30min / 1h (Gantt only)
- ✅ Publish button (CTA principal)
- ✅ Date navigation with calendar picker

#### Health Tiles Band (Zone B)
- ✅ Conducteurs absents (with breakdown by type: CM, PO, SPL, VL)
- ✅ Véhicules indisponibles
- ✅ % Courses placées / reste à placer
- ✅ Modifications (annulations + changements)
- ✅ Prestations à échéance (4 semaines)
- ✅ Alertes par niveau (critique/warning/info)
- ✅ Conducteurs hors amplitude (au-dessus/en-dessous)
- ✅ Clickable tiles (filter/expand detail)

#### Gantt View (Zone C)
- ✅ 24h on-screen (no lateral scroll)
- ✅ Zoom levels: 15min / 30min / 1h
- ✅ Sticky resource rows (vehicles/drivers)
- ✅ Course blocks with visual indicators (Sup, sensible, alertes)
- ✅ Tooltips on hover (client, presta, start/end, lieux, ressource)
- ✅ Idle segments (gray bands between courses)
- ✅ Color coding: Régulière / SUP / Sensible / Non affecté
- ✅ Resource info: immatriculation, type, énergie, tournée number (vehicles) | nom, type permis (drivers)

#### List View (Zone C)
- ✅ Interactive table with sortable columns
- ✅ Resource column (driver/vehicle based on view mode)
- ✅ Course details (ref, client, trajet, date/time, status)
- ✅ Actions column
- ✅ Filterable and searchable

#### Course Detail Dialog
- ✅ Tab: Détails (trajet, exigences, flag sensible, code chargement)
- ✅ Tab: Affectation (driver/vehicle selection, AI suggestions, subcontractor)
- ✅ Tab: Modifications (adresse, dates, horaires, période validité)
- ✅ Tab: Annulation (raison, délai prévenance, commentaire, période)
- ✅ Tab: Notes (commentaires historisés)
- ✅ Real-time validation (compatibility checks)
- ✅ AI suggestions with scores
- ✅ Subcontractor option
- ✅ Loading code (1 per day per course, no duplication)
- ✅ Comments (free text, historized)

#### Publish Workflow
- ✅ Publish dialog with metrics summary
- ✅ Version labeling (SXX-v1, v2...)
- ✅ Publication note
- ✅ Success feedback

### ❌ MISSING FEATURES

#### Header
- ❌ **Week-end mode** (only Jour/Semaine implemented)
- ❌ **Custom dates** selector (only day/week navigation)

#### Gantt View
- ❌ **Cross-midnight handling**: Courses that traverse midnight (e.g., 23:00 → 01:00) should show continuation indicator "▶ vers j+1"
- ❌ **Driver change visualization**: In vehicle view, visual grouping for courses of same driver to show driver changes
- ⚠️ **Week view**: Spec says "si semaine: une ligne par véhicule et par jour donc 7 lignes par véhicule en regroupant les jours similaires" - Current implementation shows single day or full week, but not the grouped-by-day structure

#### Course Detail Dialog
- ⚠️ **Bulk assignment**: Spec mentions "les ressources peuvent être affectées en 'bulk' pour toutes les courses de la presta ou par trajet" - Currently only individual course assignment
- ⚠️ **Historization**: Spec mentions "Toute modification est historisée" - Need to verify if modification history is displayed

#### Publish Workflow
- ⚠️ **Freeze mechanism**: Spec says "le plan de la semaine S+1 se fige pour la Conception: il n'est plus modifiable dans le module conception" - Need to verify if published plans are locked from editing
- ⚠️ **Version snapshot**: Spec mentions "snapshot immutable pour le reporting" - Need to verify if immutable snapshots are created

---

## 📋 ECRAN A PLACER

### ✅ IMPLEMENTED FEATURES

#### Global Stats
- ✅ Stats by week: S+1, S+2, S+3, S+4+
- ✅ Count of prestations and courses per week
- ✅ Clickable stats (filter by week)

#### List of Prestations
- ✅ Prestation reference
- ✅ Course reference (grouped by prestation)
- ✅ Client
- ✅ Loading → Delivery sites (with multi-destination support)
- ✅ Date with color indicators (urgency)
- ✅ Schedules (start/end time)
- ✅ Prestation type (régulière / SUP / spot)
- ✅ Reason for non-placement (with icons)
- ✅ Sensitive flag
- ✅ Vehicle type / energy type
- ✅ Missing resources indicator
- ✅ Grid view (3 per line)
- ✅ Table view (interactive)
- ✅ View toggle (Grid/Table)

#### Filters
- ✅ Date / Period (week filter)
- ✅ Prestation type (régulière / SUP)
- ✅ Reason for non-placement
- ✅ Client
- ✅ Vehicle type
- ✅ Driver permit type / skills
- ✅ Search (client, prestation, trajet)

#### Actions
- ✅ Open detail drawer (prestation/ride)
- ✅ Assign courses (individual or bulk from drawer)
- ✅ Multi-select prestations (in drawer)

#### Prestation Drawer
- ✅ All courses of prestation displayed
- ✅ Bulk assignment option
- ✅ Individual course assignment
- ✅ Course details (trajet, dates, requirements)
- ✅ Sensitive flag
- ✅ Missing resources

### ❌ MISSING FEATURES

#### List Columns (Spec Requirements)
- ⚠️ **Week indicator**: Spec mentions showing week (S+1, S+2, etc.) - Currently shown in grid view but not prominently in table view
- ✅ All other required columns are present

#### Actions
- ❌ **Access tournee view**: Spec mentions "Accéder à la vue de la tournée correspondante (si existante)" - Not implemented

---

## 📋 OTHER PAGES

### Courses Page (`/conception/courses`)
- ✅ Comprehensive course listing
- ✅ Grid/Table view toggle
- ✅ Filters and search
- ✅ Course detail dialog
- ⚠️ **Not in spec**: This page is not explicitly mentioned in the spec document

### Créer un SUP (`/conception/sup`)
- ✅ SUP creation form
- ✅ Multi-stop trajet builder
- ✅ Vehicle/driver requirements
- ✅ Sensitive flag
- ⚠️ **Not in spec**: This page is not explicitly mentioned in the spec document (spec mentions "Modèles SUP" in Commercial module)

### Conducteurs (`/conception/conducteurs`)
- ✅ Driver management view
- ✅ Availability, amplitude, skills
- ✅ Current assignments
- ⚠️ **Not in spec**: This page is not explicitly mentioned in the spec document

### Reporting (`/conception/reporting`)
- ✅ Analytics dashboard
- ✅ Key metrics
- ⚠️ **Not in spec**: This page is not explicitly mentioned in the spec document

---

## 🎯 SUMMARY

### Critical Missing Features (High Priority)
1. **Cross-midnight course handling** in Gantt view
2. **Week-end mode** in period selector
3. **Custom dates** selector
4. **Access tournee view** from À Placer page
5. **Bulk assignment** at prestation/trajet level in course dialog

### Nice-to-Have / Enhancement
1. Driver change visualization in vehicle view (Gantt)
2. Week view with grouped-by-day structure (7 lines per vehicle)
3. Modification historization display
4. Published plan freeze mechanism verification
5. Immutable version snapshots for reporting

### Pages Not in Spec
- Courses page (useful but not specified)
- Créer un SUP (spec mentions "Modèles SUP" in Commercial, not Conception)
- Conducteurs page (useful but not specified)
- Reporting page (useful but not specified)

---

## ✅ OVERALL COMPLIANCE: ~85%

**Core features**: ✅ Well implemented
**Edge cases**: ⚠️ Some missing
**UI/UX**: ✅ Good alignment with spec
**Workflow**: ✅ Functional
