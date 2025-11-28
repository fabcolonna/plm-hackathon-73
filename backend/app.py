import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from src.database.repository import BatteryRepository
from src.engine.decision import DecisionEngine

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize Neo4j connection
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_DB_PASSWORD")
NEO4J_DB_NAME = os.getenv("NEO4J_DB_NAME", "neo4j")

# Recycler endpoint - takes only an ID and runs the decision algorithm
@app.route('/recycler/evaluate', methods=['POST'])
def recycler_evaluate():
    try:
        data = request.get_json()
        battery_id = data.get('id')
        market_id = data.get('market_id', 'MKT_STD_2024')  # Default market config
        
        if not battery_id:
            return jsonify({'error': 'Battery ID is required'}), 400
        
        # Connect to Neo4j
        repo = BatteryRepository(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, database_name=NEO4J_DB_NAME)
        engine = DecisionEngine()
        
        try:
            # Get digital twin data
            digital_twin = repo.get_digital_twin(battery_id, market_id)
            
            if not digital_twin:
                return jsonify({'error': 'Battery not found'}), 404
            
            # Run decision algorithm
            result = engine.evaluate_battery(digital_twin)
            
            # Save decision to database
            decision_id = repo.save_decision(battery_id, result, market_id)
            
            # Return the scores (4 string-integer pairs)
            return jsonify(result['scores']), 200
            
        finally:
            repo.close()
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Garagist POST endpoint - push data to Neo4j
@app.route('/garagist/battery', methods=['POST'])
def garagist_create():
    try:
        data = request.get_json()
        
        # Extract the 4 inputs for battery data
        battery_id = data.get('battery_id')
        voltage = data.get('voltage')
        capacity = data.get('capacity')
        temperature = data.get('temperature')
        
        # Validate required fields
        if None in [battery_id, voltage, capacity, temperature]:
            return jsonify({
                'error': 'All fields are required: battery_id, voltage, capacity, temperature'
            }), 400
        
        repo = BatteryRepository(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, database_name=NEO4J_DB_NAME)
        
        try:
            result = repo.create_battery_record(battery_id, voltage, capacity, temperature)
            return jsonify(result), 201
        finally:
            repo.close()
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Garagist GET endpoint - read all battery information from Neo4j
@app.route('/garagist/battery/<battery_id>', methods=['GET'])
def garagist_read(battery_id):
    try:
        repo = BatteryRepository(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, database_name=NEO4J_DB_NAME)
        
        try:
            result = repo.get_all_battery_data(battery_id)
            
            if not result:
                return jsonify({'error': 'Battery not found'}), 404
            
            return jsonify(result), 200
        finally:
            repo.close()
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Proprietaire endpoint - get battery status
@app.route('/proprietaire/status/<battery_id>', methods=['GET'])
def proprietaire_status(battery_id):
    try:
        repo = BatteryRepository(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, database_name=NEO4J_DB_NAME)
        
        try:
            result = repo.get_battery_status(battery_id)
            
            if not result:
                return jsonify({'error': 'Battery not found'}), 404
            
            return jsonify(result), 200
        finally:
            repo.close()
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update battery status endpoint
@app.route('/battery/status/<battery_id>', methods=['PUT'])
def update_battery_status(battery_id):
    try:
        data = request.get_json()
        
        # Extract new status
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status field is required'}), 400
        
        repo = BatteryRepository(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, database_name=NEO4J_DB_NAME)
        
        try:
            success = repo.update_battery_status(battery_id, new_status)
            
            if not success:
                return jsonify({'error': 'Battery not found or update failed'}), 404
            
            return jsonify({
                'message': 'Battery status updated successfully',
                'battery_id': battery_id,
                'new_status': new_status
            }), 200
        finally:
            repo.close()
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)