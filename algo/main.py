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

    print(f"\n🚀 Lancement du diagnostic (Market: {market_id})")
    print("=" * 60)

    try:
        # Récupération des données
        data = repo.get_digital_twin(bat_id, market_id)
        if not data:
            print(f"⚠️ {bat_id}: Introuvable.")
            return {
                "status": "error",
                "message": f"Battery {bat_id} not found in market {market_id}.",
                "battery_id": bat_id
            }

        # Exécution Algorithme
        result = engine.evaluate_battery(data)
        rec = result['recommendation']
        
        print(f"🔋 ID: {bat_id} | SOH: {data['diagnosis']['soh_percent']}%")
        print(f"   🎯 Décision: {rec.upper()}")
        print(f"   📊 Scores: {result['scores']}")
        
        # Sauvegarde en Base
        decision_id = repo.save_decision(bat_id, result, market_id)
        print(f"   💾 Sauvegardé dans Neo4j (Decision ID: {decision_id})")
        print("-" * 60)

        # Pour API
        return {
            "status": "success",
            "decision_id": decision_id,
            "battery_id": bat_id,
            "market_id": market_id,
            "recommendation": rec,
            "scores": result['scores']
        }

    except Exception as e:
        print(f"❌ Erreur: {e}")
        return {
            "status": "error",
            "message": str(e),
            "battery_id": bat_id
        }
    finally:
        repo.close()

if __name__ == "__main__":
    run_sorting_process(bat_id="BAT_002", market_id="MKT_STD_2024")