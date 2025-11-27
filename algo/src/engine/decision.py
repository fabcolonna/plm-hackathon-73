# src/engine/decision.py
from .rules import BusinessRules

class DecisionEngine:
    def __init__(self):
        self.rules = BusinessRules()

    # batterie model, accident cases

    def evaluate_battery(self, digital_twin):
        diag = digital_twin['diagnosis']
        passport = digital_twin['passport']
        market = digital_twin['market']

        # VETO -> RECYCLE DIRECT
        if diag['critical_defects'] or diag['history_of_abuse']:
            return self._build_result("Recycle", "CRITICAL_SAFETY_FAIL", 
                                      {"Reuse": 0, "Remanufacture": 0, "Repurpose": 0, "Recycle": 100})

        scores = {"Reuse": 0, "Remanufacture": 0, "Repurpose": 0, "Recycle": 20}
        
        soh = diag['soh_percent']
        if soh >= self.rules.MIN_SOH_FOR_REUSE: 
            scores["Reuse"] += soh * self.rules.WEIGHTS_SOH["Reuse"]

        if soh >= self.rules.MIN_SOH_FOR_REMANUFACTURE: 
            scores["Remanufacture"] += soh * self.rules.WEIGHTS_SOH["Remanufacture"]

        if soh >= self.rules.MIN_SOH_FOR_REPURPOSE: 
            scores["Repurpose"] += soh * self.rules.WEIGHTS_SOH["Repurpose"]
        else: 
            scores["Recycle"] += 50

        if diag['internal_resistance_mOhm'] < self.rules.MAX_RESISTANCE_FOR_REUSE:
            scores["Reuse"] += 30

        modularity = passport.get('design_modularity_score', 0)
        scores["Remanufacture"] += modularity * 5

        chem = passport.get('chemistry', '')
        if chem == 'NMC': scores["Recycle"] += 40
        if chem == 'LFP': scores["Repurpose"] += 20; scores["Recycle"] += 10

        scores["Reuse"]         *= market.get('weight_reuse', 1.0)
        scores["Remanufacture"] *= market.get('weight_remanufacture', 1.0)
        scores["Repurpose"]     *= market.get('weight_repurpose', 1.0)
        scores["Recycle"]       *= market.get('weight_recycle', 1.0)

        best_option = max(scores, key=scores.get)
        reason = f"Best score ({scores[best_option]:.1f}) based on SOH {soh}% & Market"
        
        return self._build_result(best_option, reason, scores)

    def _build_result(self, rec, reason, scores):
        return {
            "recommendation": rec,
            "reason": reason,
            "scores": {k: round(v, 1) for k, v in scores.items()}
        }