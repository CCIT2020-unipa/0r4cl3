from flask import Blueprint, request

from ..services.sqlite_database import SQLiteDatabase
from .utils import streams_utils, auth_utils

streams = Blueprint('streams', __name__)
VALID_QUERY_MODES = ('fulltext', 'regexp')


@streams.route('/streams')
@auth_utils.auth_middleware
def __streams():
  # Parse query string parameters
  after_timestamp = request.args.get('after', default=0, type=int)
  query = request.args.get('query', default=None, type=str)
  query_mode = request.args.get('mode', default=None, type=str)
  db_cursor = None

  # Fetch streams based on the given query
  if query is not None:
    if query_mode is None or query_mode not in VALID_QUERY_MODES:
      # Send error response on invalid query mode
      return { 'error': 'invalid query mode given, valid query modes are fulltext or regexp' }, 400

    if query_mode == 'fulltext':
      # Fetch streams that contain a given string in their payload
      db_cursor = SQLiteDatabase().execute('''
        SELECT OldestNewestStreamFragments.stream_no AS stream_no,
               OldestNewestStreamFragments.newest_timestamp AS last_updated,
               protocols,
               src_ip,
               src_port,
               dst_ip,
               dst_port,
               BLOB_SIZE(OldestNewestStreamFragments.stream_no) AS size,
               BLOB_SIZE_STR(OldestNewestStreamFragments.stream_no) AS size_str
        FROM StreamFragments
        INNER JOIN OldestNewestStreamFragments ON
                   StreamFragments.stream_no = OldestNewestStreamFragments.stream_no AND
                   StreamFragments.timestamp = OldestNewestStreamFragments.oldest_timestamp
        INNER JOIN IndexedStreamFragments ON
                   StreamFragments.stream_no = IndexedStreamFragments.stream_no
        WHERE data_str MATCH ?
        GROUP BY OldestNewestStreamFragments.stream_no
        ORDER BY rank
      ''', query)
    elif query_mode == 'regexp':
      # Fetch streams with payload that matches a given regular expression
      db_cursor = SQLiteDatabase().execute('''
        SELECT OldestNewestStreamFragments.stream_no AS stream_no,
               OldestNewestStreamFragments.newest_timestamp AS last_updated,
               protocols,
               src_ip,
               src_port,
               dst_ip,
               dst_port,
               BLOB_SIZE(OldestNewestStreamFragments.stream_no) AS size,
               BLOB_SIZE_STR(OldestNewestStreamFragments.stream_no) AS size_str
        FROM StreamFragments INNER JOIN OldestNewestStreamFragments ON
             StreamFragments.stream_no = OldestNewestStreamFragments.stream_no AND
             StreamFragments.timestamp = OldestNewestStreamFragments.oldest_timestamp
        WHERE BLOB_TO_STR(data) REGEXP ?
      ''', query)
  else:
    # Fetch streams modified after a given timestamp
    db_cursor = SQLiteDatabase().execute('''
      SELECT OldestNewestStreamFragments.stream_no AS stream_no,
             OldestNewestStreamFragments.newest_timestamp AS last_updated,
             protocols,
             src_ip,
             src_port,
             dst_ip,
             dst_port,
             BLOB_SIZE(OldestNewestStreamFragments.stream_no) AS size,
             BLOB_SIZE_STR(OldestNewestStreamFragments.stream_no) AS size_str
      FROM StreamFragments INNER JOIN OldestNewestStreamFragments ON
           StreamFragments.stream_no = OldestNewestStreamFragments.stream_no AND
           StreamFragments.timestamp = OldestNewestStreamFragments.oldest_timestamp
      WHERE last_updated > ?
      ORDER BY last_updated DESC
    ''', after_timestamp)

  # Extract the highest level protocol for each stream
  fetched_streams = db_cursor.fetchall()
  fetched_streams = list(map(streams_utils.extract_protocol, fetched_streams))

  # Extract highest level protocols used for the current session
  protocols = list(set(map(lambda stream: stream['protocol'], fetched_streams)))

  return {
    'streams': fetched_streams,
    'protocols': protocols
  }

@streams.route('/streams/<int:stream_no>')
@auth_utils.auth_middleware
def __stream_details(stream_no):
  # Fetch stream
  db_cursor = SQLiteDatabase().execute('''
    SELECT OldestNewestStreamFragments.stream_no AS stream_no,
           OldestNewestStreamFragments.newest_timestamp AS last_updated,
           protocols,
           src_ip,
           src_port,
           dst_ip,
           dst_port,
           BLOB_SIZE(OldestNewestStreamFragments.stream_no) AS size,
           BLOB_SIZE_STR(OldestNewestStreamFragments.stream_no) AS size_str
    FROM StreamFragments INNER JOIN OldestNewestStreamFragments ON
         StreamFragments.stream_no = OldestNewestStreamFragments.stream_no AND
         StreamFragments.timestamp = OldestNewestStreamFragments.oldest_timestamp
    WHERE OldestNewestStreamFragments.stream_no = ?
  ''', stream_no)
  fetched_stream = db_cursor.fetchone()

  # Fetch stream fragments
  db_cursor = SQLiteDatabase().execute('''
    SELECT timestamp,
           src_ip,
           src_port,
           dst_ip,
           dst_port,
           BLOB_TO_STR(data) AS data
    FROM StreamFragments
    WHERE LENGTH(data) > 0 AND
          stream_no = ?
    ORDER BY timestamp ASC
  ''', stream_no)
  fetched_stream_fragments = db_cursor.fetchall()

  return {
    'stream': fetched_stream,
    'fragments': fetched_stream_fragments
  }
