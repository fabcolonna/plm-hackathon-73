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
    
    def save_decision(self, battery_id, decision_data, market_id):
        """
        Enregistre le résultat de l'algorithme dans Neo4j
        """
        query = """
        MATCH (b:Battery {id: $bat_id})
        MATCH (m:MarketConfig {id: $mkt_id})
        
        CREATE (d:Decision {
            id: randomUUID(),
            date: datetime(),
            recommendation: $rec,
            reason: $reason,
            score_reuse: $s_reuse,
            score_repurpose: $s_repurpose,
            score_remanufacture: $s_reman,
            score_recycle: $s_recycle
        })
        
        MERGE (b)-[:HAS_DECISION]->(d)
        MERGE (d)-[:CONTEXTUALIZED_BY]->(m)
        
        RETURN d.id as decision_id
        """
        
        scores = decision_data['scores']
        
        with self.driver.session(database=self.database) as session:
            result = session.run(query, 
                bat_id=battery_id, 
                mkt_id=market_id,
                rec=decision_data['recommendation'],
                reason=decision_data['reason'],
                s_reuse=scores['Reuse'],
                s_repurpose=scores['Repurpose'],
                s_reman=scores['Remanufacture'],
                s_recycle=scores['Recycle']
            )
            return result.single()["decision_id"]