from neo4j import GraphDatabase

class BatteryRepository:
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
        Inclut les 12 attributs du Battery Passport.
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
                soh_percent: p.soh_percent,
                soc_percent: p.soc_percent,
                known_defects: p.known_defects,
                critical_defects: p.critical_defects,
                battery_model: p.battery_model,
                model: p.model,
                chemistry: p.chemistry,
                date_placing_market: p.date_placing_market,
                market_date: p.market_date,
                total_energy_throughput_kwh: p.total_energy_throughput_kwh,
                energy_throughput: p.energy_throughput,
                potentials_repurposing_remanufacturing: p.potentials_repurposing_remanufacturing,
                repurpose_potential: p.repurpose_potential,
                design_for_disassembly: p.design_for_disassembly,
                design_modularity_score: p.design_modularity_score,
                modularity: p.modularity,
                capacity_fade_percent_per_year: p.capacity_fade_percent_per_year,
                capacity_fade: p.capacity_fade,
                accidents: p.accidents,
                accident_history: p.accident_history,
                history_of_abuse: p.history_of_abuse,
                battery_status: p.battery_status,
                status: p.status
            },
            diagnosis: {
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
        
        FOREACH (x IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END |
            CREATE (d)-[:GENERATED_DECISION]->(dec)
        )
        
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

    # ========== NEW METHODS FOR GARAGIST & PROPRIETAIRE ==========
    
    def create_battery_record(self, battery_id, voltage, capacity, temperature):
        """
        Create a new battery record in Neo4j database.
        """
        query = """
        CREATE (b:Battery {
            id: $battery_id,
            voltage: $voltage,
            capacity: $capacity,
            temperature: $temperature,
            created_at: datetime()
        })
        RETURN b
        """
        
        parameters = {
            'battery_id': battery_id,
            'voltage': voltage,
            'capacity': capacity,
            'temperature': temperature
        }
        
        with self.driver.session(database=self.database) as session:
            try:
                session.run(query, parameters)
                return {
                    'message': 'Battery record created successfully',
                    'battery_id': battery_id
                }
            except Exception as e:
                raise Exception(f"Database error: {str(e)}")

    def get_all_battery_data(self, battery_id):
        """
        Get all battery information from Neo4j database (~10 fields).
        """
        query = """
        MATCH (b:Battery {id: $battery_id})
        OPTIONAL MATCH (b)-[:HAS_PASSPORT]->(p:BatteryPassport)
        RETURN b.id as battery_id,
               b.voltage as voltage,
               b.capacity as capacity,
               b.temperature as temperature,
               b.created_at as created_at,
               p.soh_percent as soh_percent,
               p.chemistry as chemistry,
               p.battery_model as battery_model,
               p.battery_status as battery_status,
               p.total_energy_throughput_kwh as energy_throughput
        """
        
        with self.driver.session(database=self.database) as session:
            try:
                result = session.run(query, battery_id=battery_id)
                record = result.single()
                if record:
                    return dict(record)
                return None
            except Exception as e:
                raise Exception(f"Database error: {str(e)}")

    def get_battery_status(self, battery_id):
        """
        Get battery status for proprietaire.
        """
        query = """
        MATCH (b:Battery {id: $battery_id})
        OPTIONAL MATCH (b)-[:HAS_PASSPORT]->(p:BatteryPassport)
        RETURN b.id as battery_id,
               p.battery_status as status,
               b.voltage as voltage,
               b.capacity as capacity,
               p.soh_percent as soh_percent
        """
        
        with self.driver.session(database=self.database) as session:
            try:
                result = session.run(query, battery_id=battery_id)
                record = result.single()
                if record:
                    return dict(record)
                return None
            except Exception as e:
                raise Exception(f"Database error: {str(e)}")