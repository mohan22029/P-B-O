import sqlite3
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database setup
DB_PATH = 'data/cia.db'

def init_db():
    """Initialize the SQLite database and create tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create cost_impact table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cost_impact (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_cost REAL NOT NULL,
            reduced_cost REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

@app.route('/api/cia/add', methods=['POST'])
def add_cost_impact():
    """Add a new cost impact record"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        original_cost = data.get('original_cost')
        reduced_cost = data.get('reduced_cost')
        
        if original_cost is None or reduced_cost is None:
            return jsonify({'error': 'Both original_cost and reduced_cost are required'}), 400
        
        if not isinstance(original_cost, (int, float)) or not isinstance(reduced_cost, (int, float)):
            return jsonify({'error': 'Costs must be numeric values'}), 400
        
        if original_cost < 0 or reduced_cost < 0:
            return jsonify({'error': 'Costs cannot be negative'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO cost_impact (original_cost, reduced_cost, timestamp)
            VALUES (?, ?, ?)
        ''', (original_cost, reduced_cost, datetime.now()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Cost impact record added successfully',
            'id': cursor.lastrowid,
            'original_cost': original_cost,
            'reduced_cost': reduced_cost
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/cia/summary', methods=['GET'])
def get_cost_summary():
    """Get summary statistics for all cost impact records"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get totals
        cursor.execute('''
            SELECT 
                SUM(original_cost) as original_total_cost,
                SUM(reduced_cost) as reduced_total_cost
            FROM cost_impact
        ''')
        
        result = cursor.fetchone()
        conn.close()
        
        original_total_cost = result['original_total_cost'] or 0.0
        reduced_total_cost = result['reduced_total_cost'] or 0.0
        
        # Calculate reduction percentage
        if original_total_cost > 0:
            reduction_percent = ((original_total_cost - reduced_total_cost) / original_total_cost) * 100
        else:
            reduction_percent = 0.0
        
        return jsonify({
            'original_total_cost': original_total_cost,
            'reduced_total_cost': reduced_total_cost,
            'reduction_percent': reduction_percent
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/cia/records', methods=['GET'])
def get_cost_records():
    """Get all cost impact records (optional endpoint for debugging)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, original_cost, reduced_cost, timestamp
            FROM cost_impact
            ORDER BY timestamp DESC
        ''')
        
        records = []
        for row in cursor.fetchall():
            records.append({
                'id': row['id'],
                'original_cost': row['original_cost'],
                'reduced_cost': row['reduced_cost'],
                'timestamp': row['timestamp']
            })
        
        conn.close()
        
        return jsonify({'records': records}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/cia/clear', methods=['DELETE'])
def clear_cost_records():
    """Clear all cost impact records (optional endpoint for testing)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM cost_impact')
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'All cost impact records cleared successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    # Initialize database on startup
    init_db()
    print("Cost Impact Analyzer API initialized")
    print("Database file:", os.path.abspath(DB_PATH))
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
