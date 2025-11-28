import os
from datetime import datetime
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
        Inclut tous les 12 attributs du Battery Passport.
        """
        # C'est ICI qu'on spécifie la base de données cible (batterypass)
        with self.driver.session(database=self.database) as session:
            result = session.execute_read(self._fetch_data_query, battery_id, market_config_id)
            
            if not result:
                print(f"❌ [DB: {self.database}] Aucune batterie trouvée avec l'ID {battery_id}")
                return None
            
            return result

    @staticmethod
    def _fetch_data_query(tx, battery_id, market_config_id):
        """
        Récupère toutes les données nécessaires pour l'algorithme de décision.
        Inclut les 12 attributs du Battery Passport:
        1. SOH (State of Health)
        2. SOC (State of Charge)
        3. Known defects or malfunctions
        4. Battery model
        5. Battery chemistry
        6. Date of placing on the market
        7. Total energy throughput
        8. Potentials for repurposing/remanufacturing
        9. Design for disassembly
        10. Capacity fade
        11. Informations on accidents
        12. Battery Status
        """
        query = """
        MATCH (b:Battery {id: $bat_id})
        OPTIONAL MATCH (b)-[:HAS_PASSPORT]->(p:BatteryPassport)
        OPTIONAL MATCH (b)-[:UNDERWENT_DIAGNOSIS]->(d:SortingDiagnosis)
        WITH b, p, d
        ORDER BY d.date DESC LIMIT 1
        MATCH (m:MarketConfig {id: $mkt_id})
        
        RETURN {
            battery_id: b.id,
            passport: {
                // Attribute #1: State of Health (SOH) - Attribute #58
                soh_percent: p.soh_percent,
                
                // Attribute #2: State of Charge (SOC) - peut être dans diagnosis aussi
                soc_percent: p.soc_percent,
                
                // Attribute #3: Known defects or malfunctions - Attribute #65
                known_defects: p.known_defects,
                critical_defects: p.critical_defects,
                
                // Attribute #4: Battery model - Attribute #4
                battery_model: p.battery_model,
                model: p.model,
                
                // Attribute #5: Battery chemistry - Attribute #50
                chemistry: p.chemistry,
                
                // Attribute #6: Date of placing on the market - Attribute #32
                date_placing_market: p.date_placing_market,
                market_date: p.market_date,
                
                // Attribute #7: Total energy throughput - Attribute #60
                total_energy_throughput_kwh: p.total_energy_throughput_kwh,
                energy_throughput: p.energy_throughput,
                
                // Attribute #8: Potentials for repurposing/remanufacturing - Attribute #70
                potentials_repurposing_remanufacturing: p.potentials_repurposing_remanufacturing,
                repurpose_potential: p.repurpose_potential,
                
                // Attribute #9: Design for disassembly - Attribute #76
                design_for_disassembly: p.design_for_disassembly,
                design_modularity_score: p.design_modularity_score,
                modularity: p.modularity,
                
                // Attribute #10: Capacity fade
                capacity_fade_percent_per_year: p.capacity_fade_percent_per_year,
                capacity_fade: p.capacity_fade,
                
                // Attribute #11: Informations on accidents
                accidents: p.accidents,
                accident_history: p.accident_history,
                history_of_abuse: p.history_of_abuse,
                
                // Attribute #12: Battery Status
                battery_status: p.battery_status,
                status: p.status
            },
            diagnosis: {
                // Données du diagnostic au centre de tri
                soh_percent: d.soh_percent,
                soc_percent: d.soc_percent,
                internal_resistance_mOhm: d.internal_resistance_mOhm,
                known_defects: d.known_defects,
                critical_defects: d.critical_defects,
                accidents: d.accidents,
                history_of_abuse: d.history_of_abuse,
                battery_status: d.battery_status,
                date: d.date,
                total_energy_throughput_kwh: d.total_energy_throughput_kwh
            },
            market: properties(m)
        } AS digital_twin
        """
        result = tx.run(query, bat_id=battery_id, mkt_id=market_config_id)
        record = result.single()
        return record["digital_twin"] if record else None

    def save_decision(self, battery_id, decision_result, market_config_id="MKT_STD_2024"):
        """
        Sauvegarde la décision dans Neo4j avec tous les détails.
        
        Args:
            battery_id: ID de la batterie
            decision_result: Dict contenant 'recommendation', 'reason', 'scores'
            market_config_id: ID de la configuration marché
        
        Returns:
            ID de la décision créée
        """
        with self.driver.session(database=self.database) as session:
            decision_id = session.execute_write(
                self._save_decision_query,
                battery_id,
                decision_result,
                market_config_id
            )
            return decision_id

    @staticmethod
    def _save_decision_query(tx, battery_id, decision_result, market_config_id):
        """
        Crée un nœud Decision et le connecte au diagnostic et au marché.
        """
        query = """
        MATCH (b:Battery {id: $bat_id})
        OPTIONAL MATCH (b)-[:UNDERWENT_DIAGNOSIS]->(d:SortingDiagnosis)
        WITH b, d
        ORDER BY d.date DESC LIMIT 1
        MATCH (m:MarketConfig {id: $mkt_id})
        
        CREATE (dec:Decision {
            id: 'DEC_' + toString(timestamp()) + '_' + $bat_id,
            recommendation: $recommendation,
            reason: $reason,
            score_reuse: $score_reuse,
            score_remanufacture: $score_remanufacture,
            score_repurpose: $score_repurpose,
            score_recycle: $score_recycle,
            created_at: datetime()
        })
        
        // Connecter la décision au diagnostic si disponible
        FOREACH (x IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END |
            CREATE (d)-[:GENERATED_DECISION]->(dec)
        )
        
        // Connecter la décision au marché
        CREATE (dec)-[:CONTEXTUALIZED_BY]->(m)
        
        RETURN dec.id AS decision_id
        """
        
        scores = decision_result.get('scores', {})
        result = tx.run(
            query,
            bat_id=battery_id,
            mkt_id=market_config_id,
            recommendation=decision_result.get('recommendation', ''),
            reason=decision_result.get('reason', ''),
            score_reuse=scores.get('Reuse', 0),
            score_remanufacture=scores.get('Remanufacture', 0),
            score_repurpose=scores.get('Repurpose', 0),
            score_recycle=scores.get('Recycle', 0)
        )
        record = result.single()
        return record["decision_id"] if record else None