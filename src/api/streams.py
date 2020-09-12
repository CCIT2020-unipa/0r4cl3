from flask import Blueprint, request
import sqlite3

from .utils import sqlite_utils, streams_utils

streams = Blueprint('streams', __name__)
DB_PATH = './data.db'

@streams.route('/streams')
def _streams():
  # Parse query string parameters
  after_timestamp = request.args.get('after', 0)
  data_contains = request.args.get('contains', None)

  with sqlite3.connect(DB_PATH) as db_connection:
    # Fetch values as dictionaries rather than tuples
    db_connection.row_factory = sqlite_utils.dict_factory
    db_cursor = db_connection.cursor()

    if data_contains is None:
      # Fetch streams modified after the given timestamp
      db_cursor.execute('''
        SELECT rowid,
               stream_no,
               start_time,
               end_time,
               protocols,
               host_a_ip,
               host_a_port,
               host_b_ip,
               host_b_port,
               data_length,
               data_length_string
        FROM Streams
        WHERE end_time > ?
        ORDER BY end_time DESC, rowid DESC
      ''', (after_timestamp,))
    else:
      # Fetch streams that contains a given string in their data
      db_cursor.execute('''
        SELECT rank,
               Streams.rowid,
               stream_no,
               start_time,
               end_time,
               protocols,
               host_a_ip,
               host_a_port,
               host_b_ip,
               host_b_port,
               data_length,
               data_length_string
        FROM Streams, StreamsIndex
        WHERE StreamsIndex.data_printable MATCH ? AND
              Streams.rowid = StreamsIndex.rowid
        ORDER BY rank DESC
      ''', (data_contains,))

    fetched_streams = db_cursor.fetchall()

    # Extract the highest level protocol for each stream
    fetched_streams = list(map(streams_utils.extract_protocol, fetched_streams))

    # Extract highest level protocols used for the current session
    protocols = list(set(map(lambda stream: stream['protocol'], fetched_streams)))

    return {
      'streams': fetched_streams,
      'protocols': protocols
    }

@streams.route('/streams/<int:stream_id>')
def _stream_details(stream_id):
  with sqlite3.connect(DB_PATH) as db_connection:
    # Fetch values as dictionaries rather than tuples
    db_connection.row_factory = sqlite_utils.dict_factory
    db_cursor = db_connection.cursor()

    db_cursor.execute('SELECT rowid, * FROM Streams WHERE rowid = ?', (stream_id,))

    # Remove the 'data_bytes' field from the response
    stream = db_cursor.fetchone()
    del stream['data_bytes']

    return stream
