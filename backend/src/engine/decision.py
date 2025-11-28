# src/engine/decision.py
from datetime import datetime
import numpy as np
from .rules import BusinessRules

class DecisionEngine:
    def __init__(self):
        self.rules = BusinessRules()
        self.options = ["Reuse", "Remanufacture", "Repurpose", "Recycle"]
        
    def evaluate_battery(self, digital_twin):
        """
        Évalue une batterie en utilisant une matrice de pondération.
        
        Args:
            digital_twin: Dict contenant 'diagnosis', 'passport', et 'market'
        
        Returns:
            Dict avec 'recommendation', 'reason', et 'scores'
        """
        diag = digital_twin.get('diagnosis', {})
        passport = digital_twin.get('passport', {})
        market = digital_twin.get('market', {})

        # ========== ÉTAPE 1: KILL SWITCH (Sécurité) ==========
        critical_defects = (diag.get('critical_defects', False) is True) or \
                          (passport.get('critical_defects', False) is True)
        history_of_abuse = (diag.get('history_of_abuse', False) is True) or \
                          (passport.get('history_of_abuse', False) is True)
        
        if critical_defects or history_of_abuse:
            return self._build_result("Recycle", "CRITICAL_SAFETY_FAIL", 
                                      {"Reuse": 0, "Remanufacture": 0, "Repurpose": 0, "Recycle": 100})

        # ========== ÉTAPE 2: EXTRACTION DES ATTRIBUTS ==========
        attributes = self._extract_attributes(diag, passport)
        
        # ========== ÉTAPE 3: CONSTRUCTION DE LA MATRICE DE PONDÉRATION ==========
        ponderation_matrix = self._build_ponderation_matrix(attributes)
        
        # ========== ÉTAPE 4: CALCUL DES SCORES ==========
        scores = self._calculate_scores(ponderation_matrix, attributes)
        
        # ========== ÉTAPE 5: AJUSTEMENT MARCHÉ ==========
        scores = self._apply_market_weights(scores, market)
        
        # ========== ÉTAPE 6: DÉCISION FINALE ==========
        best_option = max(scores, key=scores.get)
        reason = self._build_reason(attributes, scores, best_option)
        
        return self._build_result(best_option, reason, scores)

    def _extract_attributes(self, diag, passport):
        """Extrait et normalise les 12 attributs du Battery Passport."""
        
        # Attribute #1: State of Health (SOH)
        soh = diag.get('soh_percent', 0) or passport.get('soh_percent', 0)
        
        # Attribute #2: State of Charge (SOC)
        soc = diag.get('soc_percent', None)
        
        # Attribute #3: Known defects (déjà géré par kill switch)
        known_defects = diag.get('known_defects', '') or passport.get('known_defects', '')
        
        # Attribute #4: Battery model
        battery_model = passport.get('battery_model', '').lower()
        
        # Attribute #5: Battery chemistry
        chemistry = passport.get('chemistry', '').upper()
        
        # Attribute #6: Date of placing on market
        market_date_str = passport.get('date_placing_market', None)
        age_years = self._calculate_age(market_date_str)
        
        # Attribute #7: Total energy throughput
        energy_throughput = passport.get('total_energy_throughput_kwh', 0) or \
                           diag.get('total_energy_throughput_kwh', 0)
        
        # Attribute #8: Potentials for repurposing/remanufacturing
        repurpose_potential = passport.get('potentials_repurposing_remanufacturing', None)
        
        # Attribute #9: Design for disassembly
        design_disassembly = passport.get('design_for_disassembly', None)
        
        # Attribute #10: Capacity fade
        capacity_fade = passport.get('capacity_fade_percent_per_year', None)
        
        # Attribute #11: Informations on accidents (déjà géré par kill switch)
        accidents = diag.get('accidents', '') or passport.get('accidents', '')
        
        # Attribute #12: Battery Status
        battery_status = passport.get('battery_status', '').lower() or \
                        diag.get('battery_status', '').lower()
        
        # Autres attributs techniques
        internal_resistance = diag.get('internal_resistance_mOhm', None)
        
        return {
            'soh': soh,
            'soc': soc,
            'known_defects': known_defects,
            'battery_model': battery_model,
            'chemistry': chemistry,
            'age_years': age_years,
            'energy_throughput': energy_throughput,
            'repurpose_potential': repurpose_potential,
            'design_disassembly': design_disassembly,
            'capacity_fade': capacity_fade,
            'accidents': accidents,
            'battery_status': battery_status,
            'internal_resistance': internal_resistance
        }

    def _build_ponderation_matrix(self, attributes):
        """
        Construit une matrice de pondération [n_criteria x 4_options].
        Chaque ligne représente un critère, chaque colonne une option de fin de vie.
        """
        matrix = []
        
        # Critère 1: SOH (State of Health) - POIDS CRITIQUE
        soh_weights = self._get_soh_weights(attributes['soh'])
        matrix.append(soh_weights)
        
        # Critère 2: SOC (State of Charge) - Sécurité manipulation
        soc_weights = self._get_soc_weights(attributes['soc'])
        matrix.append(soc_weights)
        
        # Critère 3: Chemistry - Valeur des matériaux
        chemistry_weights = self._get_chemistry_weights(attributes['chemistry'])
        matrix.append(chemistry_weights)
        
        # Critère 4: Age - Obsolescence technologique
        age_weights = self._get_age_weights(attributes['age_years'])
        matrix.append(age_weights)
        
        # Critère 5: Energy Throughput - Stress cumulé
        throughput_weights = self._get_throughput_weights(attributes['energy_throughput'])
        matrix.append(throughput_weights)
        
        # Critère 6: Capacity Fade - Dégradation rapide
        fade_weights = self._get_capacity_fade_weights(attributes['capacity_fade'])
        matrix.append(fade_weights)
        
        # Critère 7: Design for Disassembly - Circularité
        design_weights = self._get_design_weights(attributes['design_disassembly'])
        matrix.append(design_weights)
        
        # Critère 8: Manufacturer Intent - Repurpose/Remanufacture potential
        intent_weights = self._get_intent_weights(attributes['repurpose_potential'])
        matrix.append(intent_weights)
        
        # Critère 9: Battery Model - Marché cible
        model_weights = self._get_model_weights(attributes['battery_model'])
        matrix.append(model_weights)
        
        # Critère 10: Battery Status
        status_weights = self._get_status_weights(attributes['battery_status'])
        matrix.append(status_weights)
        
        # Critère 11: Internal Resistance
        resistance_weights = self._get_resistance_weights(attributes['internal_resistance'])
        matrix.append(resistance_weights)
        
        return np.array(matrix)

    # ========== FONCTIONS DE PONDÉRATION PAR CRITÈRE ==========
    
    def _get_soh_weights(self, soh):
        """Pondération basée sur le State of Health."""
        if soh >= self.rules.MIN_SOH_FOR_REUSE:
            return [soh * 0.6, soh * 0.3, soh * 0.1, 0]
        elif soh >= self.rules.MIN_SOH_FOR_REMANUFACTURE:
            return [soh * 0.2, soh * 0.5, soh * 0.2, 10]
        elif soh >= self.rules.MIN_SOH_FOR_REPURPOSE:
            return [0, soh * 0.2, soh * 0.4, 20]
        else:
            return [0, 0, 0, 50]
    
    def _get_soc_weights(self, soc):
        """Pondération basée sur le State of Charge."""
        if soc is None:
            return [0, 0, 0, 0]
        if soc < self.rules.MIN_SOC_FOR_SAFE_HANDLING or soc > self.rules.MAX_SOC_FOR_SAFE_HANDLING:
            return [0, 0, 0, 10]  # Manipulation dangereuse → recycle
        return [0, 0, 0, 0]
    
    def _get_chemistry_weights(self, chemistry):
        """Pondération basée sur la chimie de la batterie."""
        weights = self.rules.CHEMISTRY_WEIGHTS.get(chemistry, {})
        return [
            weights.get('Reuse', 0),
            weights.get('Remanufacture', 0),
            weights.get('Repurpose', 0),
            weights.get('Recycle', 0)
        ]
    
    def _get_age_weights(self, age_years):
        """Pondération basée sur l'âge de la batterie."""
        if age_years is None:
            return [0, 0, 0, 0]
        if age_years <= self.rules.MAX_AGE_FOR_REUSE_YEARS:
            return [10, 5, 0, 0]
        elif age_years <= self.rules.MAX_AGE_FOR_REMANUFACTURE_YEARS:
            return [0, 10, 5, 0]
        else:
            return [0, 0, 0, 10]
    
    def _get_throughput_weights(self, throughput):
        """Pondération basée sur l'énergie totale délivrée."""
        if throughput > self.rules.HIGH_THROUGHPUT_THRESHOLD:
            return [-5, 5, 5, 5]  # Usage intensif
        return [0, 0, 0, 0]
    
    def _get_capacity_fade_weights(self, fade):
        """Pondération basée sur la dégradation de capacité."""
        if fade is None:
            return [0, 0, 0, 0]
        if fade > self.rules.MAX_CAPACITY_FADE_FOR_REUSE:
            return [-20, -10, 10, 15]
        elif fade > self.rules.MAX_CAPACITY_FADE_FOR_REMANUFACTURE:
            return [0, -15, 10, 10]
        return [0, 0, 0, 0]
    
    def _get_design_weights(self, design):
        """Pondération basée sur le design modulaire."""
        if design is None:
            return [0, 0, 0, 0]
        
        if isinstance(design, bool) and design:
            modularity_score = 10
        elif isinstance(design, str):
            modularity_score = {"high": 10, "medium": 5, "low": 0}.get(design.lower(), 0)
        else:
            modularity_score = 0
        
        remanuf_weight = modularity_score * (self.rules.WEIGHT_DESIGN_DISASSEMBLY_REMANUFACTURE / 10)
        recycle_weight = modularity_score * (self.rules.WEIGHT_DESIGN_DISASSEMBLY_RECYCLE / 10)
        return [0, remanuf_weight, 0, recycle_weight]
    
    def _get_intent_weights(self, intent):
        """Pondération basée sur l'intention du fabricant."""
        if intent is None:
            return [0, 0, 0, 0]
        
        weights = [0, 0, 0, 0]
        if isinstance(intent, str):
            if 'repurpose' in intent.lower():
                weights[2] = self.rules.WEIGHT_MANUFACTURER_INTENT_REPURPOSE
            if 'remanufacture' in intent.lower() or 'remanufacturing' in intent.lower():
                weights[1] = self.rules.WEIGHT_MANUFACTURER_INTENT_REMANUFACTURE
        return weights
    
    def _get_model_weights(self, model):
        """Pondération basée sur le modèle de batterie."""
        for category, weights in self.rules.MODEL_CATEGORIES.items():
            if category in model:
                return [
                    weights.get('Reuse', 0),
                    weights.get('Remanufacture', 0),
                    weights.get('Repurpose', 0),
                    weights.get('Recycle', 0)
                ]
        return [0, 0, 0, 0]
    
    def _get_status_weights(self, status):
        """Pondération basée sur le statut de la batterie."""
        weights = self.rules.STATUS_WEIGHTS.get(status, {})
        return [
            weights.get('Reuse', 0),
            weights.get('Remanufacture', 0),
            weights.get('Repurpose', 0),
            weights.get('Recycle', 0)
        ]
    
    def _get_resistance_weights(self, resistance):
        """Pondération basée sur la résistance interne."""
        if resistance is None:
            return [0, 0, 0, 0]
        if resistance < self.rules.MAX_RESISTANCE_FOR_REUSE:
            return [30, 10, 0, 0]
        return [0, 0, 0, 0]

    # ========== CALCUL ET AJUSTEMENTS ==========
    
    def _calculate_scores(self, matrix, attributes):
        """Calcule les scores finaux en sommant les pondérations."""
        # Score de base pour le recyclage
        base_scores = np.array([0, 0, 0, 20])
        
        # Somme des pondérations par colonne (option)
        weighted_scores = np.sum(matrix, axis=0)
        
        # Score final
        final_scores = base_scores + weighted_scores
        
        return {
            "Reuse": max(0, final_scores[0]),
            "Remanufacture": max(0, final_scores[1]),
            "Repurpose": max(0, final_scores[2]),
            "Recycle": max(0, final_scores[3])
        }
    
    def _apply_market_weights(self, scores, market):
        """Applique les pondérations du marché."""
        return {
            "Reuse": scores["Reuse"] * market.get('weight_reuse', 1.0),
            "Remanufacture": scores["Remanufacture"] * market.get('weight_remanufacture', 1.0),
            "Repurpose": scores["Repurpose"] * market.get('weight_repurpose', 1.0),
            "Recycle": scores["Recycle"] * market.get('weight_recycle', 1.0)
        }

    # ========== UTILITAIRES ==========
    
    def _calculate_age(self, market_date_str):
        """Calcule l'âge de la batterie en années."""
        if not market_date_str:
            return None
        try:
            if isinstance(market_date_str, str):
                market_date = datetime.strptime(market_date_str, '%Y-%m-%d')
            else:
                market_date = market_date_str
            return (datetime.now() - market_date).days / 365.25
        except (ValueError, TypeError):
            return None
    
    def _build_reason(self, attributes, scores, best_option):
        """Construit la raison détaillée de la recommandation."""
        reason_parts = [
            f"SOH: {attributes['soh']:.1f}%",
            f"Chemistry: {attributes['chemistry']}" if attributes['chemistry'] else "",
            f"Age: {attributes['age_years']:.1f}y" if attributes['age_years'] else "",
            f"Best score: {scores[best_option]:.1f}"
        ]
        return " | ".join([p for p in reason_parts if p])
    
    def _build_result(self, rec, reason, scores):
        """Construit le résultat final."""
        return {
            "recommendation": rec,
            "reason": reason,
            "scores": {k: float(round(v, 1)) for k, v in scores.items()}
        }
    
    def export_matrix(self, digital_twin):
        """Export la matrice de pondération pour analyse (debug/audit)."""
        diag = digital_twin.get('diagnosis', {})
        passport = digital_twin.get('passport', {})
        attributes = self._extract_attributes(diag, passport)
        matrix = self._build_ponderation_matrix(attributes)
        
        criteria_names = [
            'SOH', 'SOC', 'Chemistry', 'Age', 'Throughput', 
            'Capacity Fade', 'Design', 'Intent', 'Model', 'Status', 'Resistance'
        ]
        
        return {
            'criteria': criteria_names,
            'options': self.options,
            'matrix': matrix.tolist(),
            'attributes': attributes
        }