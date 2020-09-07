from flask import Blueprint, request, jsonify
from .utils import sqlite_utils
import sqlite3

PCAP_PATH = './test_captures/dump-2018-06-27_13_25_31.pcap'
DB_PATH = './captures.db'

captures = Blueprint('captures', __name__)

@captures.route('/captures')
def _captures():
  # Parse query string parameters
  after_timestamp = request.args.get('after', 0)

  with sqlite3.connect(DB_PATH) as db_connection:
    # Fetch values as dictionaries rather than tuples
    db_connection.row_factory = sqlite_utils.dict_factory

    # Fetch packets captured after the given timestamp
    db_cursor = db_connection.cursor()
    db_cursor.execute('''
      SELECT rowid, start_time, end_time, protocol, src_ip, src_port, dst_ip, dst_port, data_length
      FROM Captures
      WHERE start_time > ?
      ORDER BY start_time DESC, rowid DESC
    ''', (after_timestamp,))

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
