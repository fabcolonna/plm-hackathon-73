import uuid
from datetime import datetime

class BatteryDecisionEngine:
    def __init__(self, market_demands=None):
        """
        Initialise le moteur de décision.
        :param market_demands: Dictionnaire de facteurs multiplicateurs (ex: {'REPURPOSE': 1.2})
                               pour simuler l'urgence du marché.
        """
        # Configuration par défaut du marché (1.0 = neutre)
        self.market_demands = {
            "REUSE": 1.0,
            "REMANUFACTURE": 1.0,
            "REPURPOSE": 1.0,
            "RECYCLE": 1.0
        }
        if market_demands:
            self.market_demands.update(market_demands)

    def calculate_soh(self, rated_capacity, remaining_capacity):
        if rated_capacity == 0: return 0
        return remaining_capacity / rated_capacity

    def evaluate(self, passport_data):
        """
        Algorithme principal de décision multicritère.
        """
        
        # 1. Extraction et Normalisation des données
        rated_cap = passport_data.get("rated_capacity", 0)
        rem_cap = passport_data.get("remaining_capacity", 0)
        soh = self.calculate_soh(rated_cap, rem_cap)
        
        cycles = passport_data.get("number_of_cycles", 0)
        has_accidents = passport_data.get("accident_info", False)
        deep_discharges = passport_data.get("deep_discharge_events", 0)
        can_dismantle = passport_data.get("dismantling_info", False)
        chemistry = passport_data.get("chemistry", "UNKNOWN")
        
        # 2. Logique de VETO (Sécurité d'abord)
        # Si la batterie a eu un accident ou trop de décharges profondes, 
        # elle est dangereuse -> Recyclage direct.
        is_unsafe = has_accidents or (deep_discharges > 10)
        
        scores = {
            "REUSE": 0.0,
            "REMANUFACTURE": 0.0,
            "REPURPOSE": 0.0,
            "RECYCLE": 0.0
        }

        if is_unsafe:
            scores["RECYCLE"] = 100.0
            decision_reason = "SAFETY_VETO"
        else:
            # 3. Calcul des Scores (Matrice de décision)
            
            # --- A. REUSE (Réutilisation directe) ---
            # Critères : SOH très élevé (>90%), peu de cycles.
            base_reuse = soh * 100
            if soh > 0.90 and cycles < 500:
                scores["REUSE"] = base_reuse * 1.2 # Bonus excellence
            elif soh > 0.85:
                scores["REUSE"] = base_reuse
            else:
                scores["REUSE"] = base_reuse * 0.2 # Pénalité forte si SOH faible

            # --- B. REMANUFACTURE (Réparation) ---
            # Critères : SOH correct, mais SURTOUT documentation de démontage disponible.
            if can_dismantle:
                if 0.80 <= soh <= 0.95:
                    scores["REMANUFACTURE"] = 90.0 # Zone idéale
                else:
                    scores["REMANUFACTURE"] = soh * 100 * 0.8
            else:
                scores["REMANUFACTURE"] = 0.0 # Impossible sans manuel

            # --- C. REPURPOSE (Seconde vie - ex: Stockage stationnaire) ---
            # Critères : SOH moyen (60-80%), tolérance aux cycles élevés.
            if 0.60 <= soh <= 0.85:
                scores["REPURPOSE"] = 95.0 # Zone idéale pour le stationnaire
            elif soh > 0.85:
                scores["REPURPOSE"] = 70.0 # Un peu du gâchis mais possible
            else:
                scores["REPURPOSE"] = soh * 100 # Trop faible

            # --- D. RECYCLE (Matière première) ---
            # Critères : Toujours une option, score augmente si chimie précieuse (NMC) ou SOH très bas.
            base_recycle = 40.0
            if chemistry in ["NMC", "NCA"]:
                base_recycle += 20.0 # Matériaux précieux
            
            if soh < 0.60:
                base_recycle += 40.0 # Fin de vie technique
            
            scores["RECYCLE"] = base_recycle

            # 4. Application de la Demande Marché (Market Demand)
            for key in scores:
                scores[key] = scores[key] * self.market_demands.get(key, 1.0)
            
            decision_reason = "ALGORITHM_SCORE"

        # 5. Détermination du gagnant
        winner = max(scores, key=scores.get)

        # 6. Construction de l'objet de sortie (Format Neo4j)
        result = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "recommendation": winner,
            "reason": decision_reason,
            "score_reuse": round(scores["REUSE"], 2),
            "score_remanufacture": round(scores["REMANUFACTURE"], 2),
            "score_repurpose": round(scores["REPURPOSE"], 2),
            "score_recycle": round(scores["RECYCLE"], 2),
            # Snapshot des inputs pour traçabilité
            "input_soh_used": round(soh, 4),
            "input_cycles_used": cycles,
            "input_market_demand": self.market_demands
        }
        
        return result

# --- Exemple d'utilisation (Simulation) ---
if __name__ == "__main__":
    # Scénario 1 : Batterie en bon état, mais besoin urgent de stockage stationnaire (Repurpose)
    market_scenario = {"REPURPOSE": 1.5, "REUSE": 0.8} 
    
    engine = BatteryDecisionEngine(market_demands=market_scenario)

    # Données simulées venant du Battery Passport
    sample_battery = {
        "rated_capacity": 100.0,
        "remaining_capacity": 78.0, # SOH = 78%
        "number_of_cycles": 800,
        "accident_info": False,
        "deep_discharge_events": 2,
        "dismantling_info": True,
        "chemistry": "NMC"
    }

    decision = engine.evaluate(sample_battery)
    
    print("--- RÉSULTAT DE LA DÉCISION ---")
    print(f"Recommandation : {decision['recommendation']}")
    print(f"SOH Calculé    : {decision['input_soh_used']*100}%")
    print("-" * 30)
    print(f"Score Reuse         : {decision['score_reuse']}")
    print(f"Score Remanufacture : {decision['score_remanufacture']}")
    print(f"Score Repurpose     : {decision['score_repurpose']} (Boosté par le marché)")
    print(f"Score Recycle       : {decision['score_recycle']}")