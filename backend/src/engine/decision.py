# src/engine/decision.py
from datetime import datetime
from .rules import BusinessRules

class DecisionEngine:
    def __init__(self):
        self.rules = BusinessRules()

    def evaluate_battery(self, digital_twin):
        """
        Évalue une batterie en utilisant les 12 attributs du Battery Passport.
        
        Args:
            digital_twin: Dict contenant 'diagnosis', 'passport', et 'market'
        
        Returns:
            Dict avec 'recommendation', 'reason', et 'scores'
        """
        diag = digital_twin.get('diagnosis', {})
        passport = digital_twin.get('passport', {})
        market = digital_twin.get('market', {})

        # ========== ÉTAPE 1: KILL SWITCH (Sécurité) ==========
        # Attribute #3: Known defects or malfunctions
        #   - Seulement critical_defects=True déclenche le kill switch
        #   - known_defects peut être une chaîne descriptive (ex: "Minor cell imbalance") sans déclencher le kill switch
        # Attribute #11: Informations on accidents
        #   - Seulement history_of_abuse=True déclenche le kill switch
        #   - accidents peut être une chaîne descriptive sans déclencher le kill switch
        critical_defects = (diag.get('critical_defects', False) is True) or (passport.get('critical_defects', False) is True)
        history_of_abuse = (diag.get('history_of_abuse', False) is True) or (passport.get('history_of_abuse', False) is True)
        
        if critical_defects or history_of_abuse:
            return self._build_result("Recycle", "CRITICAL_SAFETY_FAIL", 
                                      {"Reuse": 0, "Remanufacture": 0, "Repurpose": 0, "Recycle": 100})

        # ========== ÉTAPE 2: SCORECARD INITIALISATION ==========
        scores = {"Reuse": 0, "Remanufacture": 0, "Repurpose": 0, "Recycle": 20}
        
        # ========== ÉTAPE 3: ATTRIBUTS PERFORMANCE & DURABILITY ==========
        
        # Attribute #1: State of Health (SOH) - CRITICAL
        soh = diag.get('soh_percent', 0) or passport.get('soh_percent', 0)
        if soh >= self.rules.MIN_SOH_FOR_REUSE: 
            scores["Reuse"] += soh * self.rules.WEIGHTS_SOH["Reuse"]
        elif soh >= self.rules.MIN_SOH_FOR_REMANUFACTURE: 
            scores["Remanufacture"] += soh * self.rules.WEIGHTS_SOH["Remanufacture"]
        elif soh >= self.rules.MIN_SOH_FOR_REPURPOSE: 
            scores["Repurpose"] += soh * self.rules.WEIGHTS_SOH["Repurpose"]
        else: 
            scores["Recycle"] += 50  # SOH < 60% → fortement orienté recyclage
        
        # Attribute #2: State of Charge (SOC)
        soc = diag.get('soc_percent', None)
        if soc is not None:
            # SOC trop bas ou trop haut peut indiquer des problèmes
            if soc < self.rules.MIN_SOC_FOR_SAFE_HANDLING or soc > self.rules.MAX_SOC_FOR_SAFE_HANDLING:
                scores["Recycle"] += 10  # Pénalité pour manipulation dangereuse
        
        # Attribute #7: Total energy throughput
        energy_throughput = passport.get('total_energy_throughput_kwh', 0) or diag.get('total_energy_throughput_kwh', 0)
        if energy_throughput > self.rules.HIGH_THROUGHPUT_THRESHOLD:
            # Usage intensif = stress élevé, favorise remanufacture ou recycle
            scores["Remanufacture"] += 5
            scores["Recycle"] += 5
            # Réduit légèrement le score Reuse (batterie fatiguée)
            scores["Reuse"] -= 5
        
        # Attribute #10: Capacity fade
        capacity_fade = passport.get('capacity_fade_percent_per_year', None)
        if capacity_fade is not None:
            if capacity_fade > self.rules.MAX_CAPACITY_FADE_FOR_REUSE:
                scores["Reuse"] -= 20  # Dégradation rapide disqualifie pour reuse
            if capacity_fade > self.rules.MAX_CAPACITY_FADE_FOR_REMANUFACTURE:
                scores["Remanufacture"] -= 15
            # Dégradation rapide favorise repurpose (moins exigeant) ou recycle
            if capacity_fade > 5.0:  # Très rapide
                scores["Repurpose"] += 10
                scores["Recycle"] += 15
        
        # Internal resistance (existant mais pas dans CSV - gardé pour compatibilité)
        internal_resistance = diag.get('internal_resistance_mOhm', None)
        if internal_resistance and internal_resistance < self.rules.MAX_RESISTANCE_FOR_REUSE:
            scores["Reuse"] += 30

        # ========== ÉTAPE 4: ATTRIBUTS CIRCULARITY ==========
        
        # Attribute #9: Design for disassembly (Attribute #76)
        design_disassembly = passport.get('design_for_disassembly', None)
        if design_disassembly:
            # Peut être Boolean ou String ("high", "medium", "low")
            if isinstance(design_disassembly, bool) and design_disassembly:
                modularity_score = 10
            elif isinstance(design_disassembly, str):
                modularity_score = {"high": 10, "medium": 5, "low": 0}.get(design_disassembly.lower(), 0)
            else:
                modularity_score = passport.get('design_modularity_score', 0)  # Fallback
            scores["Remanufacture"] += modularity_score * (self.rules.WEIGHT_DESIGN_DISASSEMBLY_REMANUFACTURE / 10)
            scores["Recycle"] += modularity_score * (self.rules.WEIGHT_DESIGN_DISASSEMBLY_RECYCLE / 10)
        
        # Attribute #8: Potentials for repurposing/remanufacturing (Attribute #70)
        repurpose_potential = passport.get('potentials_repurposing_remanufacturing', None)
        if repurpose_potential:
            if isinstance(repurpose_potential, str):
                if 'repurpose' in repurpose_potential.lower():
                    scores["Repurpose"] += self.rules.WEIGHT_MANUFACTURER_INTENT_REPURPOSE
                if 'remanufacture' in repurpose_potential.lower() or 'remanufacturing' in repurpose_potential.lower():
                    scores["Remanufacture"] += self.rules.WEIGHT_MANUFACTURER_INTENT_REMANUFACTURE

        # ========== ÉTAPE 5: ATTRIBUTS IDENTIFIERS & MATERIALS ==========
        
        # Attribute #5: Battery chemistry (Attribute #50) - CRITICAL
        chemistry = passport.get('chemistry', '').upper()
        if chemistry in self.rules.CHEMISTRY_WEIGHTS:
            chem_weights = self.rules.CHEMISTRY_WEIGHTS[chemistry]
            for option, weight in chem_weights.items():
                scores[option] += weight
        
        # Attribute #4: Battery model (Attribute #4)
        battery_model = passport.get('battery_model', '').lower()
        model_category = None
        for category in self.rules.MODEL_CATEGORIES:
            if category in battery_model:
                model_category = category
                break
        
        if model_category:
            model_weights = self.rules.MODEL_CATEGORIES[model_category]
            for option, weight in model_weights.items():
                scores[option] += weight
        
        # Attribute #6: Date of placing on the market (Attribute #32)
        market_date_str = passport.get('date_placing_market', None)
        if market_date_str:
            try:
                if isinstance(market_date_str, str):
                    market_date = datetime.strptime(market_date_str, '%Y-%m-%d')
                else:
                    market_date = market_date_str
                age_years = (datetime.now() - market_date).days / 365.25
                
                if age_years <= self.rules.MAX_AGE_FOR_REUSE_YEARS:
                    scores["Reuse"] += 10
                elif age_years <= self.rules.MAX_AGE_FOR_REMANUFACTURE_YEARS:
                    scores["Remanufacture"] += 5
                else:
                    scores["Recycle"] += 10  # Batterie ancienne
            except (ValueError, TypeError):
                pass  # Date invalide, on ignore
        
        # Attribute #12: Battery Status
        battery_status = passport.get('battery_status', '').lower() or diag.get('battery_status', '').lower()
        if battery_status in self.rules.STATUS_WEIGHTS:
            status_weights = self.rules.STATUS_WEIGHTS[battery_status]
            for option, weight in status_weights.items():
                scores[option] += weight

        # ========== ÉTAPE 6: AJUSTEMENT MARCHÉ ==========
        scores["Reuse"]         *= market.get('weight_reuse', 1.0)
        scores["Remanufacture"] *= market.get('weight_remanufacture', 1.0)
        scores["Repurpose"]     *= market.get('weight_repurpose', 1.0)
        scores["Recycle"]       *= market.get('weight_recycle', 1.0)

        # ========== ÉTAPE 7: DÉCISION FINALE ==========
        best_option = max(scores, key=scores.get)
        
        # Construire la raison détaillée
        reason_parts = [
            f"SOH: {soh:.1f}%",
            f"Chemistry: {chemistry}" if chemistry else "",
            f"Status: {battery_status}" if battery_status else "",
            f"Best score: {scores[best_option]:.1f}"
        ]
        reason = " | ".join([p for p in reason_parts if p])
        
        return self._build_result(best_option, reason, scores)

    def _build_result(self, rec, reason, scores):
        return {
            "recommendation": rec,
            "reason": reason,
            "scores": {k: round(v, 1) for k, v in scores.items()}
        }