from typing import Any
import sqlite3
import re


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

    # TODO: restore full-text searches support
    # # Create the 'StreamsIndex' table to perform full-text queries
    # db_cursor.execute('''
    #   CREATE VIRTUAL TABLE IF NOT EXISTS StreamsIndex USING fts5(data_printable, tokenize=porter)
    # ''')
    #
    # # Keep 'Streams' and 'StreamsIndex' tables in sync using triggers
    # # Trigger on INSERT
    # db_cursor.execute('''
    #   CREATE TRIGGER IF NOT EXISTS OnStreamsInsert AFTER INSERT ON Streams BEGIN
    #     INSERT INTO StreamsIndex(rowid, data_printable) VALUES (new.rowid, new.data_printable);
    #   END
    # ''')
    #
    # # Trigger on UPDATE
    # db_cursor.execute('''
    #   CREATE TRIGGER IF NOT EXISTS OnStreamsUpdate UPDATE OF data_printable ON Streams BEGIN
    #     UPDATE StreamsIndex SET data_printable = new.data_printable WHERE rowid = old.rowid;
    #   END
    # ''')
    #
    # # Trigger on DELETE
    # db_cursor.execute('''
    #   CREATE TRIGGER IF NOT EXISTS OnStreamsDelete AFTER DELETE ON Streams BEGIN
    #     DELETE FROM StreamsIndex WHERE rowid = old.rowid;
    #   END
    # ''')

    # Empty tables content
    # db_cursor.execute('DELETE FROM StreamFragments')
    # db_cursor.execute('DELETE FROM StreamsIndex')

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

    # Fetch values as dictionaries rather than tuples
    db_cursor.row_factory = dict_factory

    # Execute the statement and commit any changes
    db_cursor.execute(statement, args)
    db_connection.commit()

    return db_cursor
