from typing import Any
import sqlite3
import re

# Reference: https://docs.python.org/3/library/sqlite3.html#sqlite3.Connection.row_factory
def dict_factory(cursor, row):
  d = {}

  for idx, col in enumerate(cursor.description):
    d[col[0]] = row[idx]

  return d

class SQLiteDatabase:
  # Begin of singleton pattern
  class __SQLiteDatabase:
    def __init__(self):
      pass

    def __str__(self):
      return repr(self)

  instance = None

  def __init__(self):
    if not SQLiteDatabase.instance:
      SQLiteDatabase.instance = SQLiteDatabase.__SQLiteDatabase()

  def __getattr__(self, name):
    return getattr(self.instance, name)
  # End of singleton pattern

  path: str

  @staticmethod
  def setup(db_path: str):
    SQLiteDatabase.path = db_path

    # Connect to SQLite
    db_connection = sqlite3.connect(db_path)
    db_cursor = db_connection.cursor()

    # Setup the necessary tables
    # Create the 'StreamFragments' table
    db_cursor.execute('''
      CREATE TABLE IF NOT EXISTS StreamFragments (
        stream_no INTEGER NOT NULL,
        sub_stream_no INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        protocols TEXT NOT NULL,
        src_ip TEXT NOT NULL,
        src_port TEXT NOT NULL,
        dst_ip TEXT NOT NULL,
        dst_port TEXT NOT NULL,
        data BLOB NOT NULL
      )
    ''')

    db_cursor.execute('''
      CREATE VIEW IF NOT EXISTS OldestNewestStreamFragments AS
      SELECT stream_no,
             MIN(timestamp) AS oldest_timestamp,
             MAX(timestamp) AS newest_timestamp
      FROM StreamFragments
      GROUP BY stream_no
    ''')

    # Create the 'IndexedStreamFragments' table to perform full-text queries
    db_cursor.execute('''
      CREATE VIRTUAL TABLE IF NOT EXISTS IndexedStreamFragments USING fts5(
        stream_no UNINDEXED,
        data_str,
        tokenize=porter
      )
    ''')

    # Keep 'StreamFragments' and 'IndexedStreamFragments' tables in sync using triggers
    # Trigger on INSERT
    db_cursor.execute('''
      CREATE TRIGGER IF NOT EXISTS OnStreamFragmentsInsert AFTER INSERT ON StreamFragments BEGIN
        INSERT INTO IndexedStreamFragments(rowid, stream_no, data_str) VALUES (new.rowid, new.stream_no, BLOB_TO_STR(new.data));
      END
    ''')

    # Trigger on UPDATE
    db_cursor.execute('''
      CREATE TRIGGER IF NOT EXISTS OnStreamFragmentsUpdate UPDATE OF data ON StreamFragments BEGIN
        UPDATE IndexedStreamFragments SET data_str = BLOB_TO_STR(new.data) WHERE rowid = old.rowid;
      END
    ''')

    # Trigger on DELETE
    db_cursor.execute('''
      CREATE TRIGGER IF NOT EXISTS OnStreamFragmentsDelete AFTER DELETE ON StreamFragments BEGIN
        DELETE FROM IndexedStreamFragments WHERE rowid = old.rowid;
      END
    ''')

    # Empty tables content
    db_cursor.execute('DELETE FROM StreamFragments')
    db_cursor.execute('DELETE FROM IndexedStreamFragments')

    # Close cursor
    db_connection.commit()
    db_cursor.close()

  @staticmethod
  def close():
    # Connect to SQLite
    db_connection = sqlite3.connect(SQLiteDatabase.path)

    # Commit any pending changes and close the connection
    db_connection.commit()
    db_connection.close()

  @staticmethod
  def execute(statement: str, *args: [Any]) -> sqlite3.Cursor:
    # Connect to SQLite
    db_connection = sqlite3.connect(SQLiteDatabase.path)
    db_cursor = db_connection.cursor()

    # Register REGEXP function (not present by default in SQLite)
    db_connection.create_function('REGEXP', 2, SQLiteDatabase.__regexp)

    # Register BLOB-related functions
    db_connection.create_aggregate('BLOB_CONCAT', 1, SQLiteDatabase.__BlobConcat)
    db_connection.create_function('BLOB_TO_STR', 1, SQLiteDatabase.__blob_to_str)
    db_connection.create_function('BLOB_SIZE', 1, SQLiteDatabase.__blob_size)
    db_connection.create_function('BLOB_SIZE_STR', 1, SQLiteDatabase.__blob_size_str)

    # Fetch values as dictionaries rather than tuples
    db_cursor.row_factory = dict_factory

    # Execute the statement and commit any changes
    db_cursor.execute(statement, args)
    db_connection.commit()

    return db_cursor

  @staticmethod
  def __regexp(expression, item):
    return re.compile(expression).search(item) is not None

  class __BlobConcat:
    data: bytes

    def __init__(self):
      self.data = bytes()

    def step(self, value: bytes):
      self.data += value

    def finalize(self) -> bytes:
      return self.data

  @staticmethod
  def __blob_to_str(data: bytes) -> str:
    # Replace string terminators with whitespaces to avoid losing data when SQLite is involved
    data = data.replace(b'\x00', b'\x20')

    # Replace wrong bytes with '�' character
    return data.decode('utf-8', 'replace')

  @staticmethod
  def __blob_size(stream_no: int) -> int:
    db_cursor = SQLiteDatabase().execute('''
      SELECT LENGTH(BLOB_CONCAT(data)) AS size
      FROM StreamFragments
      GROUP BY stream_no
      HAVING stream_no = ?
    ''', stream_no)
    fetched_data = db_cursor.fetchone()

    return fetched_data['size'] if fetched_data is not None else 0

  @staticmethod
  def __blob_size_str(stream_no: int) -> str:
    size = SQLiteDatabase.__blob_size(stream_no)
    suffix = 'B'

    # Source: https://stackoverflow.com/a/1094933
    for unit in ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z']:
      if abs(size) < 1024.0:
        return '%3.1f%s%s' % (size, unit, suffix)
      size /= 1024.0
    return '%.1f%s%s' % (size, 'Y', suffix)
