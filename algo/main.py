import os
from dotenv import load_dotenv
from src.database.repository import BatteryRepository
from src.engine.decision import DecisionEngine

load_dotenv()

def run_sorting_process(bat_id, market_id):
    # Connexion à la base de données Neo4j
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER")
    password = os.getenv("NEO4J_DB_PASSWORD")
    db_name = os.getenv("NEO4J_DB_NAME")

    print(f"🔌 Connexion à {db_name}...")
    repo = BatteryRepository(uri, user, password, database_name=db_name)
    engine = DecisionEngine()
    
    # Simulation de scan de 4 batteries différentes
    #batteries = ["BAT_001", "BAT_002", "BAT_003", "BAT_004"]
    #market_id = "MKT_STD_2024" # Marché standard

    print(f"\n🚀 Lancement du diagnostic (Market: {market_id})")
    print("=" * 60)

    try:
        #for bat_id in batteries:
        # Récupération des données
        data = repo.get_digital_twin(bat_id, market_id)
        if not data:
            print(f"⚠️ {bat_id}: Introuvable.")
            #continue

        # Exécution Algorithme
        result = engine.evaluate_battery(data)
        rec = result['recommendation']
        
        # Affichage Console
        print(f"🔋 ID: {bat_id} | SOH: {data['diagnosis']['soh_percent']}%")
        print(f"   🎯 Décision: {rec.upper()}")
        print(f"   📊 Scores: {result['scores']}")
        
        # Sauvegarde en Base
        decision_id = repo.save_decision(bat_id, result, market_id)
        print(f"   💾 Sauvegardé dans Neo4j (Decision ID: {decision_id})")
        print("-" * 60)

    except Exception as e:
        print(f"❌ Erreur: {e}")
    finally:
        repo.close()

if __name__ == "__main__":
    run_sorting_process(bat_id="BAT_001", market_id="MKT_STD_2024")