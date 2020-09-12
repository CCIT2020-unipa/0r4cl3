from flask import Blueprint, request
import sqlite3
import re

from .utils import sqlite_utils, streams_utils

streams = Blueprint('streams', __name__)
DB_PATH = './data.db'
VALID_QUERY_MODES = ('fulltext', 'regexp')


def regexp(expression, item):
  return re.compile(expression).search(item) is not None

@streams.route('/streams')
def _streams():
  # Parse query string parameters
  after_timestamp = request.args.get('after', 0)
  query = request.args.get('query', '')
  query_mode = request.args.get('mode', None)

  with sqlite3.connect(DB_PATH) as db_connection:
    # Register REGEXP function (not present by default in SQLite)
    db_connection.create_function('REGEXP', 2, regexp)

    # Fetch values as dictionaries rather than tuples
    db_connection.row_factory = sqlite_utils.dict_factory
    db_cursor = db_connection.cursor()

    # Fetch streams based on the given query
    if len(query) > 0:
      if query_mode is None or query_mode not in VALID_QUERY_MODES:
        # Send error response on invalid query mode
        return { 'error': 'invalid query mode given, valid query modes are fulltext or regexp' }, 400

      if query_mode == 'fulltext':
        # Fetch streams that contain a given string in their payload
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
        ''', (query,))
      elif query_mode == 'regexp':
        # Fetch streams with payload that matches a given regular expression
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
          WHERE StreamsIndex.data_printable REGEXP ? AND
                Streams.rowid = StreamsIndex.rowid
          ORDER BY rank DESC
        ''', (query,))
    else:
      # Fetch streams modified after a given timestamp
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
