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
      # TODO: restore full-text searches support
      return { 'error': 'not implemented yet' }, 500
    elif query_mode == 'regexp':
      # Fetch streams with payload that matches a given regular expression
      # TODO: restore regexp searches support
      return {'error': 'not implemented yet'}, 500
  else:
    # Fetch streams modified after a given timestamp
    db_cursor = SQLiteDatabase().execute('''
      SELECT OldestNewestStreamFragments.stream_no AS stream_no,
             OldestNewestStreamFragments.newest_timestamp AS last_updated,
             protocols,
             src_ip,
             src_port,
             dst_ip,
             dst_port
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

# TODO: restore stream details route
# def _streams():
#     if query_mode == 'fulltext':
#       # Fetch streams that contain a given string in their payload
#       db_cursor = SQLiteDatabase().execute('''
#         SELECT rank,
#                Streams.rowid,
#                stream_no,
#                start_time,
#                end_time,
#                protocols,
#                host_a_ip,
#                host_a_port,
#                host_b_ip,
#                host_b_port,
#                data_length,
#                data_length_string
#         FROM Streams, StreamsIndex
#         WHERE StreamsIndex.data_printable MATCH ? AND
#               Streams.rowid = StreamsIndex.rowid
#         ORDER BY rank DESC
#       ''', query)
#     elif query_mode == 'regexp':
#       # Fetch streams with payload that matches a given regular expression
#       db_cursor = SQLiteDatabase().execute('''
#         SELECT rank,
#                Streams.rowid,
#                stream_no,
#                start_time,
#                end_time,
#                protocols,
#                host_a_ip,
#                host_a_port,
#                host_b_ip,
#                host_b_port,
#                data_length,
#                data_length_string
#         FROM Streams, StreamsIndex
#         WHERE StreamsIndex.data_printable REGEXP ? AND
#               Streams.rowid = StreamsIndex.rowid
#         ORDER BY rank DESC
#       ''', query)
#   else:
#     # Fetch streams modified after a given timestamp
#
# @streams.route('/streams/<int:stream_id>')
# @auth_utils.auth_middleware
# def _stream_details(stream_id):
#   # Remove the 'data_bytes' field from the response
#   stream = SQLiteDatabase.execute('SELECT rowid, * FROM Streams WHERE rowid = ?', stream_id).fetchone()
#   del stream['data_bytes']
#
#   return stream
