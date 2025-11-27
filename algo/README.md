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

Parmi la centaine d'attributs du Battery Passport, nous avons garder que les 6 indicateurs qui impactent directement l'algorithme de tri.

### A. Les Facteurs Bloquants (Sécurité & Veto)
Ces critères peuvent forcer le Recyclage immédiat pour sécurité.
* Défauts Critiques : Dommages physiques visibles (perforation, fuite, gonflement).
* Historique d'Abus : Si la batterie a subi des températures extrêmes ou des accidents majeurs.

### B. Les Facteurs de Viabilité (État de Santé)
Ces critères déterminent le score pour Reuse ou Repurpose.
* SOH (State of Health) : Le ratio Capacité Restante / Capacité Initiale. C'est le juge de paix (ex: >90% = Reuse).
* Résistance Interne : Si elle est trop élevée, la batterie chauffe et est inapte à la réutilisation véhicule, mais OK pour le stockage stationnaire.

### C. Les Facteurs Économiques & Techniques (Passport)
Ces critères favorisent le Remanufacturing ou le Recyclage.
* Facilité de Démontage : Si le fabricant fournit les manuels et que le design est modulaire, le score Remanufacture augmente.
* Chimie (ex: NMC vs LFP) : Influence la valeur de revente des matériaux pour le Recyclage.

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
L'algorithme `src/engine/decision.py` croise les données techniques du Passeport (Chimie, Modularité) avec l'état réel du Diagnostic (Résistance, Défauts) et les besoins du Marché.

Le processus se déroule en 3 étapes :

1. Le "Kill Switch"
Avant tout calcul, l'algorithme vérifie la sécurité.
Si Critical Defects (perforation, gonflement) OU History of Abuse est VRAI alors **DÉCISION IMMÉDIATE : RECYCLE**.
Tous les autres scores sont mis à 0. La sécurité n'est pas négociable.

2. La "Scorecard"
Si la batterie est sûre, chaque option démarre à 0 (sauf Recycle qui a une base de 20pts) et accumule des points selon des critères précis :

* Option A : REUSE (Réutilisation directe)
    * Cible : Batterie "comme neuve".
    * +50 pts si SOH ≥ 90% (Seuil configurable dans rules.py).
    * +30 pts si Résistance Interne < 30 mOhm (Indicateur de chauffe).
    * Pénalité : Score faible si la résistance est trop haute, même avec un bon SOH.

* Option B : REMANUFACTURE (Réparation)
    * Cible : Batterie saine mais nécessitant une intervention.
    * +40 pts si SOH ≥ 85%.
    * +0 à 50 pts selon le Design Modularity Score (Donnée Passeport).
    * Logique : On ne recommande pas la réparation si la batterie est soudée et impossible à démonter (Modularité faible).

* Option C : REPURPOSE (Seconde vie - ex: Stockage)
    * Cible : Batterie fatiguée pour la mobilité mais stable.
    * +60 pts si SOH ≥ 60% (Le stockage stationnaire est moins exigeant).
    * +20 pts si Chimie = LFP (Très stable, idéale pour le stockage domestique).

* Option D : RECYCLE (Extraction matières)
    * Cible : Batterie en fin de vie ou matériaux précieux.
    * Base : 20 pts (Toujours une option possible).
    * +50 pts si SOH < 60% (Trop usée pour le reste).
    * +40 pts si Chimie = NMC (Haute valeur du Nickel/Cobalt à la revente).

3. L'Ajustement Marché
Le score technique brut est ensuite multiplié par le coefficient du marché actuel (stocké dans Neo4j `MarketConfig`).

Formule Finale : **`Score_Final = Score_Technique x Market_Weight`**