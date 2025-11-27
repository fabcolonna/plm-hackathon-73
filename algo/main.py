import os
from dotenv import load_dotenv
from src.database.repository import BatteryRepository

# 1. Charger les variables d'environnement depuis le fichier .env
load_dotenv()

def run_sorting_process(qr_code_id):
    # Récupération des secrets
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER")
    password = os.getenv("NEO4J_DB_PASSWORD")
    db_name = os.getenv("NEO4J_DB_NAME")

    print(f"🔌 Connexion à la base de données : {db_name}...")

    # Initialisation du Repository avec la base spécifique
    repo = BatteryRepository(uri, user, password, database_name=db_name)

    try:
        # Simulation du processus
        market_context = "MKT_STD_2024"
        print(f"🔎 Recherche du Digital Twin pour : {qr_code_id}")
        
        data = repo.get_digital_twin(qr_code_id, market_context)

        if data:
            print(f"✅ Données reçues. SOH: {data['diagnosis']['soh_percent']}%")
            # C'est ici qu'on appellera bientôt l'algorithme de décision
        else:
            print("⚠️ Batterie inconnue ou données incomplètes.")

    except Exception as e:
        print(f"❌ Erreur critique : {e}")
    finally:
        repo.close()

if __name__ == "__main__":
    # Test avec une des batteries créées précédemment
    run_sorting_process("BAT_001")