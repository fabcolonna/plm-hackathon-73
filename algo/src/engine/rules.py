# src/engine/rules.py

class BusinessRules:
    """
    Configuration centralisée des seuils de décision basée sur les 12 attributs du Battery Passport.
    """
    
    # --- KILL SWITCH (Sécurité) ---
    # Si True, la batterie part au recyclage direct peu importe le reste.
    CRITICAL_DEFECTS_ALLOWED = False
    
    # --- SEUILS SOH (State of Health) - Attribute #58 ---
    MIN_SOH_FOR_REUSE = 90.0          # Comme neuf (≥90% pour réutilisation directe)
    MIN_SOH_FOR_REMANUFACTURE = 85.0  # Réparable (≥85% pour remanufacturing)
    MIN_SOH_FOR_REPURPOSE = 60.0      # OK pour stockage stationnaire (≥60%)
    MIN_SOH_FOR_RECYCLE_THRESHOLD = 60.0  # En dessous, fortement orienté recyclage
    
    # --- SEUILS SOC (State of Charge) ---
    MIN_SOC_FOR_SAFE_HANDLING = 20.0  # Minimum pour manipulation sécurisée (%)
    MAX_SOC_FOR_SAFE_HANDLING = 80.0  # Maximum pour manipulation sécurisée (%)
    
    # --- SEUILS TECHNIQUES ---
    MAX_RESISTANCE_FOR_REUSE = 30     # mOhm (Au-dessus, ça chauffe trop pour un VE)
    
    # --- CAPACITY FADE (Attribute #10) ---
    MAX_CAPACITY_FADE_FOR_REUSE = 2.0      # % par an (dégradation rapide disqualifie pour reuse)
    MAX_CAPACITY_FADE_FOR_REMANUFACTURE = 3.0  # % par an
    
    # --- TOTAL ENERGY THROUGHPUT (Attribute #60) ---
    # Utilisé pour valider le SOH (usage intensif = stress élevé)
    HIGH_THROUGHPUT_THRESHOLD = 1000  # kWh (au-dessus, considéré comme usage intensif)
    
    # --- AGE CALCULATION (Date of placing on market - Attribute #32) ---
    MAX_AGE_FOR_REUSE_YEARS = 3      # Ans (batterie récente pour reuse)
    MAX_AGE_FOR_REMANUFACTURE_YEARS = 5  # Ans
    
    # --- PONDÉRATIONS (Impact du SOH sur le score) ---
    WEIGHTS_SOH = {
        "Reuse": 0.6,
        "Remanufacture": 0.4,
        "Repurpose": 0.3,
        "Recycle": 0.0
    }
    
    # --- SCORING WEIGHTS FOR NEW ATTRIBUTES ---
    # Design for disassembly (Attribute #76)
    WEIGHT_DESIGN_DISASSEMBLY_REMANUFACTURE = 50  # Points max si design modulaire
    WEIGHT_DESIGN_DISASSEMBLY_RECYCLE = 20        # Points si facile à recycler
    
    # Potentials for repurposing/remanufacturing (Attribute #70)
    WEIGHT_MANUFACTURER_INTENT_REPURPOSE = 30     # Points si manufacturer indique repurpose possible
    WEIGHT_MANUFACTURER_INTENT_REMANUFACTURE = 25  # Points si manufacturer indique remanufacture possible
    
    # Battery chemistry (Attribute #50)
    CHEMISTRY_WEIGHTS = {
        "NMC": {"Recycle": 40, "Repurpose": 5},   # NMC = valeur recyclage élevée
        "LFP": {"Repurpose": 20, "Recycle": 10},  # LFP = stable pour stockage
        "LCO": {"Recycle": 35, "Repurpose": 5},
        "NCA": {"Recycle": 38, "Repurpose": 5}
    }
    
    # Battery Status (Attribute #12)
    STATUS_WEIGHTS = {
        "waste": {"Recycle": 50}
    }
    
    # Battery model (Attribute #4) - utilisé pour déterminer le marché cible
    # Les modèles e-bike sont plus adaptés au repurpose que les modèles industriels
    MODEL_CATEGORIES = {
        "e-bike": {"Repurpose": 10, "Reuse": 5},
        "automotive": {"Reuse": 15, "Remanufacture": 10},
        "industrial": {"Repurpose": 5, "Recycle": 5},
        "consumer": {"Repurpose": 8, "Reuse": 5}
    }