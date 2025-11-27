# 🔋 Battery Passport - Système d'Aide à la Décision (DSS) pour Centre de Tri

## 1. Contexte et Objectif
Ce projet répond au **Défi #3**. L'objectif est de fournir un algorithme multicritère permettant à un centre de tri de déterminer automatiquement la meilleure voie de valorisation pour une batterie usagée parmi les 4 options :
1.  **Reuse (Réutilisation)** : Utilisation directe (ex: véhicule à véhicule).
2.  **Remanufacture (Remanufacturage)** : Réparation/Remplacement de modules pour retour à l'usage initial.
3.  **Repurpose (Réaffectation)** : Seconde vie (ex: stockage stationnaire).
4.  **Recycle (Recyclage)** : Extraction des matières premières.

---

## 2. Workflow

Le processus de décision suit une approche linéaire déclenchée par l'arrivée physique de la batterie au centre de tri.

1.  **Scan QR Code** : L'opérateur scanne le QR Code sur la batterie.
    *   *Donnée extraite* : `Battery Passport Identifier` (URL ou UUID).
2.  **Récupération des Données** : Le système interroge la base de données (ou le registre distribué) pour récupérer le jumeau numérique (Passport).
3.  **Exécution de l'Algorithme** : Calcul des scores pour les 4 voies de valorisation.
4.  **Stockage Neo4j** : La décision et les scores sont enregistrés dans le graphe pour la traçabilité.

---

## 3. Liste des Paramètres d'Entrée Sélectionnés

L'algorithme utilise **12 attributs critiques** du Battery Passport qui impactent directement la décision de tri.

### A. Les Facteurs Bloquants (Sécurité & Veto)
Ces critères peuvent forcer le Recyclage immédiat pour sécurité.
* **Attribute #3:** Défauts Critiques (Known defects or malfunctions) : Dommages physiques visibles (perforation, fuite, gonflement).
* **Attribute #11:** Historique d'Abus (Informations on accidents) : Si la batterie a subi des températures extrêmes ou des accidents majeurs.

### B. Les Facteurs de Viabilité (État de Santé)
Ces critères déterminent le score pour Reuse ou Repurpose.
* **Attribute #1:** SOH (State of Health) : Le ratio Capacité Restante / Capacité Initiale. CRITICAL - C'est le juge de paix (ex: ≥90% = Reuse, ≥60% = Repurpose).
* **Attribute #2:** SOC (State of Charge) : État de charge actuel, utilisé pour la sécurité de manipulation.
* **Attribute #7:** Total Energy Throughput : Historique d'utilisation (stress subi). Valide le SOH.
* **Attribute #10:** Capacity Fade : Taux de dégradation (%/an). Une dégradation rapide disqualifie pour le Reuse long terme.
* Résistance Interne : Si elle est trop élevée, la batterie chauffe et est inapte à la réutilisation véhicule, mais OK pour le stockage stationnaire.

### C. Les Facteurs Économiques & Techniques (Passport)
Ces critères favorisent le Remanufacturing ou le Recyclage.
* **Attribute #4:** Battery Model : Détermine le design et le marché (e-bike vs. Industrial).
* **Attribute #5:** Battery Chemistry : CRITICAL - Détermine la méthode de recyclage et la sécurité (NMC = valeur recyclage élevée, LFP = stable pour stockage).
* **Attribute #6:** Date of Placing on Market : L'âge combiné avec le SOH indique la fiabilité et le cycle de vie restant.
* **Attribute #8:** Potentials for Repurposing/Remanufacturing : Intention du fabricant - si la batterie est conçue pour la réutilisation, la décision est facilitée.
* **Attribute #9:** Design for Disassembly : Si le fabricant fournit les manuels et que le design est modulaire, le score Remanufacture augmente.

### D. Les Facteurs de Statut
* **Attribute #12:** Battery Status : Statut actuel ('original', 'repurposed', 're-used', 'remanufactured', 'waste'). Influence la décision finale.

> **Note:** Voir `NEO4J_SCHEMA.md` pour le schéma complet de la base de données avec tous les attributs.

---


## 4. Modèle de Données (Graph Neo4j)

Nous nous basons sur le schéma du model neo4j mais nous l'enrichissons pour inclure la **traçabilité de la décision**. L'algorithme se base sur les données de la batterie (Passeport) pour générer un **Scorecard**.

Chaque option (Reuse, Remanufacture, Repurpose, Recycle) reçoit une note basée sur des critères pondérés.

### Nœuds
*   `Battery` : L'objet physique (ID unique).
*   `BatteryPassport` : Les données constructeur (Chimie, Capacité nominale, Design).
*   `SortingDiagnosis` : Les données relevées au centre de tri (SOH réel, Défauts visuels).
*   `MarketConfig` : La configuration du marché au moment T.
*   `Decision` : Le résultat calculé.

### Relations
*   `(:Battery)-[:HAS_PASSPORT]->(:BatteryPassport)`
*   `(:Battery)-[:UNDERWENT_DIAGNOSIS]->(:SortingDiagnosis)`
*   `(:SortingDiagnosis)-[:GENERATED_DECISION]->(:Decision)`
*   `(:Decision)-[:CONTEXTUALIZED_BY]->(:MarketConfig)`

--- 

## 5. L'algorithme de décision

L'algorithme ne doit pas être une "boîte noire" (comme un réseau de neurones profond), car le Centre de Tri doit pouvoir justifier sa décision (réglementation EU Battery Regulation).

Nous utilisons une approche par Scorecard (Carte de Score). Chaque batterie reçoit 4 scores (un par voie de valorisation). Le score le plus élevé l'emporte sauf si un Veto de Sécurité est déclenché.

### Les Règles de Calcul (Matrice de Décision)
L'algorithme `src/engine/decision.py` croise les données techniques du Passeport (tous les 12 attributs) avec l'état réel du Diagnostic et les besoins du Marché.

Le processus se déroule en 7 étapes :

1. **Le "Kill Switch"**
   Avant tout calcul, l'algorithme vérifie la sécurité.
   Si **Attribute #3** (Critical Defects) OU **Attribute #11** (Accidents/History of Abuse) est VRAI alors **DÉCISION IMMÉDIATE : RECYCLE**.
   Tous les autres scores sont mis à 0. La sécurité n'est pas négociable.

2. **Initialisation de la Scorecard**
   Si la batterie est sûre, chaque option démarre à 0 (sauf Recycle qui a une base de 20pts).

3. **Attributs Performance & Durability**
   * **Attribute #1 (SOH):** Score principal selon seuils (≥90% Reuse, ≥85% Remanufacture, ≥60% Repurpose)
   * **Attribute #2 (SOC):** Vérification sécurité manipulation
   * **Attribute #7 (Energy Throughput):** Usage intensif favorise Remanufacture/Recycle
   * **Attribute #10 (Capacity Fade):** Dégradation rapide disqualifie Reuse, favorise Repurpose/Recycle

4. **Attributs Circularity**
   * **Attribute #8 (Repurposing/Remanufacturing Potential):** Intention fabricant (+30 pts Repurpose, +25 pts Remanufacture)
   * **Attribute #9 (Design for Disassembly):** Modularité favorise Remanufacture (+50 pts max)

5. **Attributs Identifiers & Materials**
   * **Attribute #4 (Battery Model):** Catégorie (e-bike, automotive, industrial) influence les scores
   * **Attribute #5 (Chemistry):** CRITICAL - NMC (+40 Recycle), LFP (+20 Repurpose)
   * **Attribute #6 (Market Date):** Âge influence la décision (récent = Reuse, ancien = Recycle)
   * **Attribute #12 (Battery Status):** Statut actuel influence les scores

6. **Résistance Interne** (mesurée au diagnostic)
   * Résistance < 30 mOhm : +30 pts Reuse

7. **L'Ajustement Marché**
   Le score technique brut est ensuite multiplié par le coefficient du marché actuel (stocké dans Neo4j `MarketConfig`).

**Formule Finale :** `Score_Final = Score_Technique x Market_Weight`

> **Configuration:** Tous les seuils et poids sont configurables dans `src/engine/rules.py`