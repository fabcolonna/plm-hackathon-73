import os
from neo4j import GraphDatabase

class BatteryRepository:
    # On passe le nom de la database à l'initialisation
    def __init__(self, uri, user, password, database_name="neo4j"):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.database = database_name

    def close(self):
        self.driver.close()

    def get_digital_twin(self, battery_id, market_config_id="MKT_STD_2024"):
        """
        Récupère les données depuis la base spécifique définie dans __init__
        """
        # C'est ICI qu'on spécifie la base de données cible (batterytest)
        with self.driver.session(database=self.database) as session:
            result = session.execute_read(self._fetch_data_query, battery_id, market_config_id)
            
            if not result:
                print(f"❌ [DB: {self.database}] Aucune batterie trouvée avec l'ID {battery_id}")
                return None
            
            return result

    @staticmethod
    def _fetch_data_query(tx, battery_id, market_config_id):
        query = """
        MATCH (b:Battery {id: $bat_id})
        OPTIONAL MATCH (b)-[:HAS_PASSPORT]->(p:BatteryPassport)
        OPTIONAL MATCH (b)-[:UNDERWENT_DIAGNOSIS]->(d:SortingDiagnosis)
        WITH b, p, d
        ORDER BY d.date DESC LIMIT 1
        MATCH (m:MarketConfig {id: $mkt_id})
        
        RETURN {
            battery_id: b.id,
            passport: properties(p),
            diagnosis: properties(d),
            market: properties(m)
        } AS digital_twin
        """
        result = tx.run(query, bat_id=battery_id, mkt_id=market_config_id)
        record = result.single()
        return record["digital_twin"] if record else None