from typing import Any
import sqlite3
import re


def blob_to_str(data: bytes) -> str:
  return data.decode('utf-8', 'ignore')

def regexp(expression, item):
  return re.compile(expression).search(item) is not None

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
    # db_cursor.execute('DELETE FROM StreamFragments')
    # db_cursor.execute('DELETE FROM IndexedStreamFragments')

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
    db_connection.create_function('REGEXP', 2, regexp)

    # Register BLOB_TO_STR function
    db_connection.create_function('BLOB_TO_STR', 1, blob_to_str)

    # Fetch values as dictionaries rather than tuples
    db_cursor.row_factory = dict_factory

    # Execute the statement and commit any changes
    db_cursor.execute(statement, args)
    db_connection.commit()

    return db_cursor
