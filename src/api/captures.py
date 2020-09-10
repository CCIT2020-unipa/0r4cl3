from flask import Blueprint, request, jsonify
from .utils import sqlite_utils, captures_utils
import sqlite3

captures = Blueprint('captures', __name__)
DB_PATH = './captures.db'

@captures.route('/captures')
def _captures():
  # Parse query string parameters
  after_timestamp = request.args.get('after', 0)
  data_contains = request.args.get('contains', None)

  with sqlite3.connect(DB_PATH) as db_connection:
    # Fetch values as dictionaries rather than tuples
    db_connection.row_factory = sqlite_utils.dict_factory
    db_cursor = db_connection.cursor()

    if data_contains is None:
      # Fetch packets captured after the given timestamp
      db_cursor.execute('''
        SELECT rowid,
               start_time,
               end_time,
               protocols,
               host_a_ip,
               host_a_port,
               host_b_ip,
               host_b_port,
               data_length,
               data_length_string
        FROM Captures
        WHERE start_time > ?
        ORDER BY start_time DESC, rowid DESC
      ''', (after_timestamp,))
    else:
      # Fetch packets that contains a given string in their data
      db_cursor.execute('''
        SELECT rank,
               Captures.rowid,
               start_time,
               end_time,
               protocols,
               host_a_ip,
               host_a_port,
               host_b_ip,
               host_b_port,
               data_length,
               data_length_string
        FROM Captures, CapturesIndex
        WHERE CapturesIndex.data_printable MATCH ? AND
              Captures.rowid = CapturesIndex.rowid
        ORDER BY rank DESC
      ''', (data_contains,))

    packets = db_cursor.fetchall()

    # Extract the highest level protocol
    packets = list(map(captures_utils.extract_protocol, packets))

    # Fetch unique packet protocols
    db_cursor.execute('''
      -- Split ':' separated values into multiple rows
      WITH RECURSIVE split(protocol, str) AS (
        SELECT '', protocols || ':' FROM Captures
        UNION ALL SELECT substr(str, 0, instr(str, ':')), substr(str, instr(str, ':') + 1)
        FROM split WHERE str != ''
      )
      SELECT protocol FROM split WHERE protocol != ''
      GROUP BY protocol
    ''')
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
