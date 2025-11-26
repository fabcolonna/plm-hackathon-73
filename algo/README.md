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

Parmi la centaine d'attributs du Battery Passport, nous avons sélectionné ceux qui influencent directement la matrice de décision technique.

### A. Identité & Conception (Facteurs fixes)
*   **Battery chemistry** : Détermine la valeur intrinsèque pour le recyclage (ex: NMC vs LFP) et les risques de sécurité.
*   **Battery mass** : Impact logistique.
*   **Dismantling information** : Booléen (Disponibilité de manuels). Critique pour le *Remanufacturing*.

### B. État de Santé & Performance (Facteurs dynamiques)
*   **Rated capacity** (Capacité nominale d'origine).
*   **Remaining capacity** (Capacité actuelle mesurée).
    *   *Usage* : Calcul du **SOH (State of Health)** = `Remaining / Rated`.
*   **Internal resistance increase** : Indicateur de vieillissement de puissance. Si élevé = chauffe = inapte au *Reuse*.
*   **Cycle-life reference test** & **Number of cycles** : Permet d'estimer le **RUL (Remaining Useful Life)**.

### C. Sécurité & Historique (Facteurs de Veto)
*   **Information on accidents** : Indicateur binaire.
*   **Number of deep discharge events** : Dommages irréversibles potentiels.
*   **Temperature information** (Time spent in extreme temperatures) : Indicateur d'abus thermique.

---


## 4. Modèle de Données (Graph Neo4j)

Nous nous basons sur le schéma du model neo4j mais nous l'enrichissons pour inclure la **traçabilité de la décision**. L'algorithme se base sur les données de la batterie (Passeport) pour générer un **Scorecard**.

Chaque option (Reuse, Remanufacture, Repurpose, Recycle) reçoit une note basée sur des critères pondérés.

---

## 5. Modèle de Données (Neo4j)

Nous stockons désormais le détail des scores dans le nœud de décision pour expliquer pourquoi une option a gagné.

### Nœuds
*   `Battery`: l'objet physique
*   `BatteryPassport`: les données brutes importées
*   `Decision` : Stocke les 4 scores et le gagnant.

### Relations
*   `(:Battery)-[:HAS_PASSPORT]->(:BatteryPassport)`
*   `(:Battery)-[:EVALUATED_AS]->(:Decision)`

### Propriétés du nœud Decision
* id: randomUUID(),
* timestamp: datetime(),
* // 1. Le résultat final
* recommendation: "REPURPOSE",
* // 2. Le scorecard complet
* score_reuse: 15.5,
* score_remanufacture: 65.0,
* score_repurpose: 82.4,
* score_recycle: 40.0,
* // 3. Snapshot des données utilisées
* input_soh_used: 0.78,
* input_cycles_used: 450

--- 

## 6. L'algorithme de décision

L'algorithme calcule un score pour chaque option. L'option avec le score le plus élevé l'emporte.