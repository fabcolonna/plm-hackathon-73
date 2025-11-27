from neo4j import GraphDatabase

# Neo4j connection configuration
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "password"  # Change this to your Neo4j password

class Neo4jConnection:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def execute_query(self, query, parameters=None):
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]

# Initialize connection
db = Neo4jConnection(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)

def create_battery_record(battery_id, voltage, capacity, temperature):
    """
    Create a new battery record in Neo4j database.
    
    Args:
        battery_id: Unique identifier for the battery
        voltage: Battery voltage
        capacity: Battery capacity
        temperature: Battery temperature
    
    Returns:
        Dictionary with success message and created data
    """
    query = """
    CREATE (b:Battery {
        battery_id: $battery_id,
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
    
    try:
        result = db.execute_query(query, parameters)
        return {
            'message': 'Battery record created successfully',
            'battery_id': battery_id
        }
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")

def get_all_battery_data(battery_id):
    """
    Get all battery information from Neo4j database.
    
    Args:
        battery_id: Unique identifier for the battery
    
    Returns:
        Dictionary with approximately 10 fields of battery data
    """
    query = """
    MATCH (b:Battery {battery_id: $battery_id})
    RETURN b.battery_id as battery_id,
           b.voltage as voltage,
           b.capacity as capacity,
           b.temperature as temperature,
           b.created_at as created_at,
           b.health_status as health_status,
           b.cycle_count as cycle_count,
           b.manufacturer as manufacturer,
           b.model as model,
           b.last_maintenance as last_maintenance
    """
    
    parameters = {'battery_id': battery_id}
    
    try:
        result = db.execute_query(query, parameters)
        if result:
            return result[0]
        return None
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")

def get_battery_status(battery_id):
    """
    Get battery status for proprietaire.
    
    Args:
        battery_id: Unique identifier for the battery
    
    Returns:
        Dictionary with battery status information
    """
    query = """
    MATCH (b:Battery {battery_id: $battery_id})
    RETURN b.battery_id as battery_id,
           b.health_status as health_status,
           b.voltage as voltage,
           b.capacity as capacity
    """
    
    parameters = {'battery_id': battery_id}
    
    try:
        result = db.execute_query(query, parameters)
        if result:
            data = result[0]
            return {
                'battery_id': data.get('battery_id'),
                'status': data.get('health_status', 'Unknown'),
                'voltage': data.get('voltage'),
                'capacity': data.get('capacity')
            }
        return None
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")