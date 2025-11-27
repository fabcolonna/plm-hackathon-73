# src/engine/rules.py

class BusinessRules:
    """
    Configuration centralisée des seuils de décision.
    """
    
    # --- KILL SWITCH (Sécurité) ---
    # Si True, la batterie part au recyclage direct peu importe le reste.
    CRITICAL_DEFECTS_ALLOWED = False
    
    # --- SEUILS SOH (State of Health) ---
    MIN_SOH_FOR_REUSE = 80.0          # Comme neuf
    MIN_SOH_FOR_REMANUFACTURE = 70.0  # Réparable
    MIN_SOH_FOR_REPURPOSE = 50.0      # OK pour stockage stationnaire
    
    # --- SEUILS TECHNIQUES ---
    MAX_RESISTANCE_FOR_REUSE = 30     # mOhm (Au-dessus, ça chauffe trop pour un VE)
    
    # --- PONDÉRATIONS (Impact du SOH sur le score) ---
    # Un bon SOH favorise surtout le Reuse.
    WEIGHTS_SOH = {
        "Reuse": 0.6,
        "Remanufacture": 0.4,
        "Repurpose": 0.3,
        "Recycle": 0.0
    }