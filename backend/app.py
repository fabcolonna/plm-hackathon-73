from flask import Flask, request, jsonify
from flask_cors import CORS
from evaluator import evaluate_function
from db_operations import (
    create_battery_record,
    get_all_battery_data,
    get_battery_status
)

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Recycler endpoint - takes only an ID
@app.route('/recycler/evaluate', methods=['POST'])
def recycler_evaluate():
    try:
        data = request.get_json()
        battery_id = data.get('id')
        
        if not battery_id:
            return jsonify({'error': 'Battery ID is required'}), 400
        
        # Call evaluation function with the ID
        result = evaluate_function(battery_id)
        
        return jsonify(result), 200
        
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
        
        # Store in Neo4j database
        result = create_battery_record(battery_id, voltage, capacity, temperature)
        
        return jsonify(result), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Garagist GET endpoint - read all battery information from Neo4j
@app.route('/garagist/battery/<battery_id>', methods=['GET'])
def garagist_read(battery_id):
    try:
        # Get all battery data (approximately 10 fields)
        result = get_all_battery_data(battery_id)
        
        if not result:
            return jsonify({'error': 'Battery not found'}), 404
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Proprietaire endpoint - get battery status
@app.route('/proprietaire/status/<battery_id>', methods=['GET'])
def proprietaire_status(battery_id):
    try:
        # Get battery status
        result = get_battery_status(battery_id)
        
        if not result:
            return jsonify({'error': 'Battery not found'}), 404
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)