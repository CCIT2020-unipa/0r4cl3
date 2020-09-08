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
      SELECT rowid, start_time, end_time, protocol, host_a_ip, host_a_port, host_b_ip, host_b_port, data_length, data_length_string
      FROM Captures
      WHERE start_time > ?
      ORDER BY start_time DESC, rowid DESC
    ''', (after_timestamp,))
    packets = db_cursor.fetchall()

    # Fetch unique packet protocols
    db_cursor.execute('SELECT protocol FROM Captures GROUP BY protocol')
    unique_protocols = list(map(lambda row: row['protocol'], db_cursor.fetchall()))

    # Return the captured data as JSON
    return jsonify({
      'packets': packets,
      'unique_protocols': unique_protocols
    })

@captures.route('/captures/<int:packet_id>')
def _packet_details(packet_id):
  with sqlite3.connect(DB_PATH) as db_connection:
    # Fetch values as dictionaries rather than tuples
    db_connection.row_factory = sqlite_utils.dict_factory
    db_cursor = db_connection.cursor()
    db_cursor.execute('SELECT rowid, * FROM Captures WHERE rowid = ?', (packet_id,))

    # Remove the 'data_bytes' field from the response
    packet = db_cursor.fetchone()
    del packet['data_bytes']

    return jsonify(packet)
