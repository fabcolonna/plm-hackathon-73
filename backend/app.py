from flask import Flask, request, jsonify
from flask_cors import CORS
from evaluator import evaluate_function

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/evaluate', methods=['POST'])
def evaluate():
    try:
        data = request.get_json()
        
        # Extract the 10 arguments
        arg1 = data.get('arg1')
        arg2 = data.get('arg2')
        arg3 = data.get('arg3')
        arg4 = data.get('arg4')
        arg5 = data.get('arg5')
        arg6 = data.get('arg6')
        arg7 = data.get('arg7')
        arg8 = data.get('arg8')
        arg9 = data.get('arg9')
        arg10 = data.get('arg10')
        
        # Validate that all arguments are provided
        if None in [arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10]:
            return jsonify({
                'error': 'All 10 arguments (arg1-arg10) are required'
            }), 400
        
        # Call the modular evaluation function
        result = evaluate_function(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)