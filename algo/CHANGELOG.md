# Changelog - Intégration des 12 Attributs du Battery Passport

## Résumé des Changements

Ce document décrit les modifications apportées pour intégrer les 12 attributs du Battery Passport dans l'algorithme de décision et le schéma Neo4j.

---

## Fichiers Modifiés

### 1. `src/engine/rules.py`
**Changements:**
- Ajout de seuils et poids pour tous les 12 attributs
- Nouveaux seuils pour SOC, Capacity Fade, Energy Throughput, Age
- Ajout de `CHEMISTRY_WEIGHTS` pour différentes chimies (NMC, LFP, LCO, NCA)
- Ajout de `STATUS_WEIGHTS` pour les différents statuts de batterie
- Ajout de `MODEL_CATEGORIES` pour différents types de modèles
- Configuration des poids pour Design for Disassembly et Manufacturer Intent

**Nouveaux seuils:**
- `MIN_SOH_FOR_REUSE`: 90.0% (augmenté de 80%)
- `MIN_SOH_FOR_REMANUFACTURE`: 85.0% (augmenté de 70%)
- `MIN_SOH_FOR_REPURPOSE`: 60.0% (augmenté de 50%)
- `MAX_CAPACITY_FADE_FOR_REUSE`: 2.0% par an
- `MAX_CAPACITY_FADE_FOR_REMANUFACTURE`: 3.0% par an
- `HIGH_THROUGHPUT_THRESHOLD`: 1000 kWh
- `MAX_AGE_FOR_REUSE_YEARS`: 3 ans
- `MAX_AGE_FOR_REMANUFACTURE_YEARS`: 5 ans

---

### 2. `src/engine/decision.py`
**Changements majeurs:**
- Réécriture complète de `evaluate_battery()` pour utiliser les 12 attributs
- Implémentation de 7 étapes de calcul au lieu de 3
- Gestion robuste des valeurs manquantes avec fallbacks
- Calcul d'âge à partir de la date de mise sur le marché
- Intégration de tous les nouveaux attributs dans le scoring

**Nouveaux attributs intégrés:**
1. ✅ State of Health (SOH) - Déjà présent, amélioré
2. ✅ State of Charge (SOC) - Nouveau
3. ✅ Known defects or malfunctions - Amélioré
4. ✅ Battery model - Nouveau
5. ✅ Battery chemistry - Déjà présent, amélioré
6. ✅ Date of placing on the market - Nouveau
7. ✅ Total energy throughput - Nouveau
8. ✅ Potentials for repurposing/remanufacturing - Nouveau
9. ✅ Design for disassembly - Amélioré
10. ✅ Capacity fade - Nouveau
11. ✅ Informations on accidents - Amélioré
12. ✅ Battery Status - Nouveau

**Logique de scoring améliorée:**
- Kill Switch vérifie maintenant Attribute #3 et #11
- Scoring détaillé pour chaque option avec tous les attributs
- Raison de décision enrichie avec plus de détails

---

### 3. `src/database/repository.py`
**Changements:**
- Mise à jour de `_fetch_data_query()` pour récupérer tous les 12 attributs
- Support de multiples alias pour chaque propriété (compatibilité)
- Ajout de la méthode `save_decision()` manquante
- Création de `_save_decision_query()` pour persister les décisions dans Neo4j

**Nouvelles propriétés récupérées:**
- Tous les attributs du BatteryPassport avec leurs alias
- Tous les attributs du SortingDiagnosis
- Support pour les formats de date flexibles

**Méthode `save_decision()`:**
- Crée un nœud `Decision` avec tous les scores
- Connecte la décision au `SortingDiagnosis` et au `MarketConfig`
- Génère un ID unique avec timestamp
- Enregistre la raison de la décision

---

## Nouveaux Fichiers

### 4. `NEO4J_SCHEMA.md`
Documentation complète du schéma Neo4j avec:
- Description détaillée de tous les nœuds
- Liste complète des 12 attributs avec leurs propriétés
- Exemples de requêtes Cypher
- Notes d'implémentation

### 5. `CHANGELOG.md`
Ce fichier - résumé des changements

---

## Modifications du README.md

- Mise à jour de la section "Liste des Paramètres d'Entrée" pour refléter les 12 attributs
- Description détaillée de chaque attribut et son impact
- Mise à jour de la section "Algorithme de décision" avec les 7 étapes
- Référence au nouveau fichier `NEO4J_SCHEMA.md`

---

## Impact sur l'Algorithme

### Avant
- Utilisait seulement 6 indicateurs principaux
- Scoring simplifié avec peu de critères
- Pas de gestion de l'âge, du capacity fade, ou du statut

### Après
- Utilise les 12 attributs complets du Battery Passport
- Scoring multi-critères sophistiqué
- Prise en compte de l'historique (âge, throughput, capacity fade)
- Gestion du statut de la batterie
- Intégration de l'intention du fabricant

---

## Compatibilité

### Rétrocompatibilité
- Les anciennes propriétés sont toujours supportées via des alias
- L'algorithme fonctionne même si certains attributs sont manquants (valeurs par défaut sûres)
- Les noms de propriétés multiples sont supportés (ex: `soh_percent`, `soh`, etc.)

### Migration Neo4j
Pour migrer une base existante, ajoutez les nouvelles propriétés aux nœuds existants:

```cypher
// Exemple: Ajouter les nouveaux attributs à un BatteryPassport existant
MATCH (p:BatteryPassport)
SET p.soc_percent = COALESCE(p.soc_percent, null),
    p.battery_model = COALESCE(p.battery_model, p.model),
    p.date_placing_market = COALESCE(p.date_placing_market, p.market_date),
    p.total_energy_throughput_kwh = COALESCE(p.total_energy_throughput_kwh, p.energy_throughput),
    p.potentials_repurposing_remanufacturing = COALESCE(p.potentials_repurposing_remanufacturing, p.repurpose_potential),
    p.design_for_disassembly = COALESCE(p.design_for_disassembly, p.modularity),
    p.capacity_fade_percent_per_year = COALESCE(p.capacity_fade_percent_per_year, p.capacity_fade),
    p.accidents = COALESCE(p.accidents, p.accident_history),
    p.battery_status = COALESCE(p.battery_status, p.status)
```

---

## Tests Recommandés

1. **Test avec données complètes:** Vérifier que tous les attributs sont bien utilisés
2. **Test avec données partielles:** Vérifier la robustesse avec des attributs manquants
3. **Test Kill Switch:** Vérifier que les défauts critiques déclenchent bien le recyclage
4. **Test de scoring:** Vérifier que les scores sont cohérents avec les règles métier
5. **Test de sauvegarde:** Vérifier que les décisions sont bien enregistrées dans Neo4j

---

## Prochaines Étapes Possibles

1. Ajouter des tests unitaires pour chaque attribut
2. Créer un script de migration pour les bases existantes
3. Ajouter une interface de visualisation des scores par attribut
4. Implémenter un système de logging détaillé pour la traçabilité
5. Ajouter la validation des données d'entrée

