from flask import Blueprint, request, jsonify
from .utils import sqlite_utils
import sqlite3

PCAP_PATH = './test_captures/dump-2018-06-27_13_25_31.pcap'
DB_PATH = './captures.db'

captures = Blueprint('captures', __name__)

@captures.route('/captures')
def _captures():
  # Parse query string parameters
  limit = request.args.get('limit', None)

  with sqlite3.connect(DB_PATH) as db_connection:
    # Fetch values as dictionaries rather than tuples
    db_connection.row_factory = sqlite_utils.dict_factory
    db_cursor = db_connection.cursor()

    # Limit number of results
    if limit is not None:
      db_cursor.execute('''
        SELECT rowid, start_time, end_time, protocol, src_ip, src_port, dst_ip, dst_port
        FROM Captures
        ORDER BY start_time DESC
        LIMIT ?
      ''', (limit,))
    else:
      db_cursor.execute('''
        SELECT rowid, start_time, end_time, protocol, src_ip, src_port, dst_ip, dst_port
        FROM Captures
        ORDER BY start_time DESC
      ''')

    # Return the captured data as JSON
    return jsonify(db_cursor.fetchall())

@captures.route('/captures/<int:packet_id>')
def _packet_details(packet_id):
  with sqlite3.connect(DB_PATH) as db_connection:
    # Fetch values as dictionaries rather than tuples
    db_connection.row_factory = sqlite_utils.dict_factory
    db_cursor = db_connection.cursor()
    db_cursor.execute('SELECT * FROM Captures WHERE rowid = ?', (packet_id,))

    # Convert 'data_bytes' BLOB to string
    packet = db_cursor.fetchone()
    packet['data_bytes'] = packet['data_bytes'].decode('utf-8')

    return jsonify(packet)
