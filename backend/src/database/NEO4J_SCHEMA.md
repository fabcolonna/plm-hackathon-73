# Neo4j Database Schema - Battery Passport Attributes

Ce document décrit le schéma de la base de données Neo4j enrichi avec les 12 attributs du Battery Passport utilisés par l'algorithme de décision.

## Structure des Nœuds

### 1. Battery
Nœud représentant la batterie physique.

**Propriétés:**
- `id` (String): Identifiant unique de la batterie

**Relations:**
- `[:HAS_PASSPORT]->(:BatteryPassport)`
- `[:UNDERWENT_DIAGNOSIS]->(:SortingDiagnosis)`

---

### 2. BatteryPassport
Nœud contenant toutes les données constructeur et les attributs statiques du passeport batterie.

**Propriétés (12 Attributs du Battery Passport):**

#### Attribute #1: State of Health (SOH) - Attribute #58
- `soh_percent` (Float): État de santé en pourcentage (0-100)
- **Catégorie:** Performance & Durability
- **Type:** Dynamic
- **Usage:** CRITICAL - Détermine la capacité résiduelle

#### Attribute #2: State of Charge (SOC)
- `soc_percent` (Float): État de charge en pourcentage (0-100)
- **Catégorie:** Performance & Durability
- **Type:** Dynamic
- **Usage:** Indique l'énergie disponible dans la batterie

#### Attribute #3: Known defects or malfunctions - Attribute #65
- `known_defects` (Boolean/String): Défauts connus ou dysfonctionnements
- `critical_defects` (Boolean): Défauts critiques (perforation, fuite, gonflement)
- **Catégorie:** Circularity
- **Type:** Dynamic
- **Usage:** CRITICAL - Un défaut irréparable mène au recyclage

#### Attribute #4: Battery model - Attribute #4
- `battery_model` (String): Modèle de la batterie
- `model` (String): Alias pour battery_model
- **Catégorie:** Identifiers
- **Type:** Static
- **Usage:** Détermine le design et le marché (e-bike vs. Industrial)

#### Attribute #5: Battery chemistry - Attribute #50
- `chemistry` (String): Chimie de la batterie (NMC, LFP, LCO, NCA)
- **Catégorie:** Materials
- **Type:** Static
- **Usage:** CRITICAL - Détermine la méthode de recyclage et la sécurité

#### Attribute #6: Date of placing on the market - Attribute #32
- `date_placing_market` (Date/String): Date de mise sur le marché (format: YYYY-MM-DD)
- `market_date` (Date/String): Alias pour date_placing_market
- **Catégorie:** Identifiers
- **Type:** Static
- **Usage:** L'âge combiné avec le SOH indique la fiabilité et le cycle de vie restant

#### Attribute #7: Total energy throughput - Attribute #60
- `total_energy_throughput_kwh` (Float/Integer): Énergie totale délivrée en kWh
- `energy_throughput` (Float/Integer): Alias
- **Catégorie:** Performance & Durability
- **Type:** Dynamic
- **Usage:** Représente l'historique d'utilisation (stress subi). Valide le SOH

#### Attribute #8: Potentials for repurposing/remanufacturing - Attribute #70
- `potentials_repurposing_remanufacturing` (String/List): Potentiels de réaffectation/remanufacturage
- `repurpose_potential` (String/List): Alias
- **Catégorie:** Circularity
- **Type:** Static
- **Usage:** Intention du fabricant - si la batterie est conçue pour la réutilisation, la décision est facilitée

#### Attribute #9: Design for disassembly - Attribute #76
- `design_for_disassembly` (Boolean/String): Design pour démontage ("high", "medium", "low")
- `design_modularity_score` (Integer): Score de modularité (0-10)
- `modularity` (String/Integer): Alias
- **Catégorie:** Circularity
- **Type:** Static
- **Usage:** Facilite le remanufacturing ou le recyclage. Réduit les coûts de traitement

#### Attribute #10: Capacity fade
- `capacity_fade_percent_per_year` (Float): Taux de dégradation de capacité (% par an)
- `capacity_fade` (Float): Alias
- **Catégorie:** Performance & Durability
- **Type:** Static
- **Usage:** Indique la vitesse de dégradation. Une dégradation rapide disqualifie pour le Reuse long terme

#### Attribute #11: Informations on accidents
- `accidents` (Boolean/String): Informations sur les accidents
- `accident_history` (Boolean/String): Historique d'accidents
- `history_of_abuse` (Boolean): Historique d'abus (températures extrêmes, etc.)
- **Catégorie:** Performance & Durability
- **Type:** Dynamic
- **Usage:** Le passeport batterie doit contenir les informations sur les accidents

#### Attribute #12: Battery Status
- `battery_status` (String): Statut de la batterie
- `status` (String): Alias
- **Valeurs possibles:** 'original', 'repurposed', 're-used', 'remanufactured', 'waste'
- **Catégorie:** Identifiers
- **Type:** Dynamic
- **Usage:** Le statut doit être défini. Un nouveau passeport doit être émis lors de remanufacturing/repurpose

**Propriétés additionnelles (pour compatibilité):**
- Toutes les propriétés peuvent avoir des alias pour assurer la compatibilité avec différents formats de données

---

### 3. SortingDiagnosis
Nœud contenant les données relevées au centre de tri lors du diagnostic.

**Propriétés principales:**
- `soh_percent` (Float): SOH mesuré au centre de tri
- `soc_percent` (Float): SOC mesuré au centre de tri
- `internal_resistance_mOhm` (Float): Résistance interne en mOhm
- `known_defects` (Boolean/String): Défauts observés
- `critical_defects` (Boolean): Défauts critiques observés
- `accidents` (Boolean/String): Accidents constatés
- `history_of_abuse` (Boolean): Historique d'abus constaté
- `battery_status` (String): Statut observé
- `date` (DateTime): Date du diagnostic
- `total_energy_throughput_kwh` (Float): Énergie totale mesurée

**Relations:**
- `[:GENERATED_DECISION]->(:Decision)`

---

### 4. MarketConfig
Nœud contenant la configuration du marché au moment T.

**Propriétés:**
- `id` (String): Identifiant unique de la configuration marché
- `weight_reuse` (Float): Poids pour l'option Reuse (défaut: 1.0)
- `weight_remanufacture` (Float): Poids pour l'option Remanufacture (défaut: 1.0)
- `weight_repurpose` (Float): Poids pour l'option Repurpose (défaut: 1.0)
- `weight_recycle` (Float): Poids pour l'option Recycle (défaut: 1.0)

**Relations:**
- `[:CONTEXTUALIZED_BY]<-(:Decision)`

---

### 5. Decision
Nœud contenant le résultat de l'algorithme de décision.

**Propriétés:**
- `id` (String): Identifiant unique de la décision (format: DEC_timestamp_batteryId)
- `recommendation` (String): Recommandation finale ("Reuse", "Remanufacture", "Repurpose", "Recycle")
- `reason` (String): Raison de la décision (justification)
- `score_reuse` (Float): Score calculé pour Reuse
- `score_remanufacture` (Float): Score calculé pour Remanufacture
- `score_repurpose` (Float): Score calculé pour Repurpose
- `score_recycle` (Float): Score calculé pour Recycle
- `created_at` (DateTime): Date de création de la décision

**Relations:**
- `[:GENERATED_DECISION]<-(:SortingDiagnosis)`
- `[:CONTEXTUALIZED_BY]->(:MarketConfig)`

---

## Relations

```
(:Battery)-[:HAS_PASSPORT]->(:BatteryPassport)
(:Battery)-[:UNDERWENT_DIAGNOSIS]->(:SortingDiagnosis)
(:SortingDiagnosis)-[:GENERATED_DECISION]->(:Decision)
(:Decision)-[:CONTEXTUALIZED_BY]->(:MarketConfig)
```

---

## Exemple de Requête Cypher pour Créer une Batterie Complète

```cypher
// Créer la batterie
CREATE (b:Battery {id: 'BAT_001'})

// Créer le passeport avec tous les attributs
CREATE (p:BatteryPassport {
    soh_percent: 85.5,
    soc_percent: 60.0,
    known_defects: false,
    critical_defects: false,
    battery_model: 'e-bike-2024',
    chemistry: 'LFP',
    date_placing_market: '2024-01-15',
    total_energy_throughput_kwh: 500,
    potentials_repurposing_remanufacturing: 'repurpose, remanufacture',
    design_for_disassembly: 'high',
    design_modularity_score: 8,
    capacity_fade_percent_per_year: 1.5,
    accidents: false,
    history_of_abuse: false,
    battery_status: 'original'
})

// Créer le diagnostic
CREATE (d:SortingDiagnosis {
    soh_percent: 85.5,
    soc_percent: 60.0,
    internal_resistance_mOhm: 25,
    known_defects: false,
    critical_defects: false,
    accidents: false,
    history_of_abuse: false,
    battery_status: 'original',
    date: datetime(),
    total_energy_throughput_kwh: 500
})

// Créer la configuration marché
CREATE (m:MarketConfig {
    id: 'MKT_STD_2024',
    weight_reuse: 1.0,
    weight_remanufacture: 1.0,
    weight_repurpose: 1.0,
    weight_recycle: 1.0
})

// Créer les relations
CREATE (b)-[:HAS_PASSPORT]->(p)
CREATE (b)-[:UNDERWENT_DIAGNOSIS]->(d)
```

---

## Notes d'Implémentation

1. **Compatibilité:** Les propriétés peuvent avoir plusieurs noms (alias) pour assurer la compatibilité avec différents formats de données.

2. **Valeurs par défaut:** Si une propriété n'est pas présente, l'algorithme utilise des valeurs par défaut sûres (par exemple, SOH = 0 si non spécifié).

3. **Priorité des données:** Les données du `SortingDiagnosis` ont priorité sur celles du `BatteryPassport` pour les attributs dynamiques (SOH, SOC, défauts).

4. **Traçabilité:** Chaque décision est enregistrée avec un timestamp et liée au diagnostic et au marché pour une traçabilité complète.

---

## Script de Peuplement de la Base de Données

Un script Cypher complet est disponible dans `neo4j_setup_script.cypher` pour créer et peupler la base de données avec 5 exemples de batteries couvrant différents scénarios :

1. **BAT_001**: Batterie en excellent état (SOH 92.5%), LFP, e-bike → **REUSE/REPURPOSE**
2. **BAT_002**: Batterie moyenne (SOH 78%), NMC, automobile, design modulaire → **REMANUFACTURE**
3. **BAT_003**: Batterie avec défauts critiques (SOH 45%), NMC → **RECYCLE** (Kill Switch)
4. **BAT_004**: Batterie repurposée (SOH 65%), LFP, e-bike → **REPURPOSE**
5. **BAT_005**: Batterie remanufacturée (SOH 88%), NCA, automobile → **REUSE/REMANUFACTURE**

Le script inclut également 3 configurations de marché différentes pour tester l'impact des poids de marché sur les décisions.

**Utilisation:**
```bash
# Dans Neo4j Browser ou Neo4j Desktop
# Copier-coller le contenu de neo4j_setup_script.cypher et exécuter
```

