from typing import Tuple, Optional
import multiprocessing
import pyshark
import sqlite3
import math

IGNORED_PROTOCOLS = ('data', 'data-text-lines', 'gsm_abis_rsl', 'gsm_ipa', 'irc')

DataStream = Tuple[
  int,    # Stream number
  int,    # Start time
  int,    # End time
  str,    # Protocols
  str,    # Host A IP
  str,    # Host A port
  str,    # Host B IP
  str,    # Host B port
  int,    # Data length (in bytes)
  str,    # Human readable data length
  bytes,  # Reconstructed stream's data
  str,    # Unicode decoded stream's data
]
CapturedPacket = Tuple[
  int,   # Corresponding stream number
  int,   # Time of capturing
  str,   # Protocols
  str,   # Host A IP
  str,   # Host A port
  str,   # Host B IP
  str,   # Host B port
  bytes  # Payload
]


# Source: https://stackoverflow.com/a/1094933
def sizeof_fmt(num, suffix='B'):
  for unit in ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z']:
    if abs(num) < 1024.0:
      return "%3.1f%s%s" % (num, unit, suffix)
    num /= 1024.0
  return "%.1f%s%s" % (num, 'Y', suffix)


# Setup the necessary tables for the DB to work
def setup_database(db_cursor: sqlite3.Cursor):
  # Create the 'Streams' table
  db_cursor.execute('''
    CREATE TABLE IF NOT EXISTS Streams (
      stream_no INTEGER NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      protocols TEXT NOT NULL,
      host_a_ip TEXT NOT NULL,
      host_a_port INTEGER NOT NULL,
      host_b_ip TEXT NOT NULL,
      host_b_port INTEGER NOT NULL,
      data_length INTEGER NOT NULL,
      data_length_string TEXT NOT NULL,
      data_bytes BLOB NOT NULL,
      data_printable TEXT NOT NULL
    )
  ''')

  # Create the 'StreamsIndex' table to perform full-text queries
  db_cursor.execute('''
    CREATE VIRTUAL TABLE IF NOT EXISTS StreamsIndex USING fts5(data_printable, tokenize=porter)
  ''')

  # Keep 'Streams' and 'StreamsIndex' tables in sync using triggers
  # Trigger on INSERT
  db_cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS OnStreamsInsert AFTER INSERT ON Streams BEGIN
      INSERT INTO StreamsIndex(rowid, data_printable) VALUES (new.rowid, new.data_printable);
    END
  ''')

  # Trigger on UPDATE
  db_cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS OnStreamsUpdate UPDATE OF data_printable ON Streams BEGIN
      UPDATE StreamsIndex SET data_printable = new.data_printable WHERE rowid = old.rowid;
    END
  ''')

  # Trigger on DELETE
  db_cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS OnStreamsDelete AFTER DELETE ON Streams BEGIN
      DELETE FROM StreamsIndex WHERE rowid = old.rowid;
    END
  ''')


def stream_exists(db_cursor: sqlite3.Cursor, stream_no: int) -> Optional[DataStream]:
  db_cursor.execute('SELECT * FROM Streams WHERE stream_no = ?', (stream_no,))
  return db_cursor.fetchone()


def parse_packet(packet) -> CapturedPacket:
  # Convert to microseconds from epoch
  timestamp = math.floor(float(packet.frame_info.time_epoch) * 1000000)

  # Extract source and destination information
  host_a_ip = packet['ip'].src
  host_a_port = packet['tcp'].srcport
  host_b_ip = packet['ip'].dst
  host_b_port = packet['tcp'].dstport

  # Extract protocols
  protocols = filter(lambda protocol: protocol not in IGNORED_PROTOCOLS, packet.frame_info.protocols.split(':'))
  protocols = ':'.join(list(protocols))

  # Extract payload data
  payload = bytes()
  if hasattr(packet['tcp'], 'payload'):
    payload = packet['tcp'].payload.binary_value

  return (
    int(packet['tcp'].stream),
    timestamp,
    protocols,
    host_a_ip,
    host_a_port,
    host_b_ip,
    host_b_port,
    payload
  )


def sniff(interface_name: str, db_path: str):
  # Start live sniffing
  capture = pyshark.LiveCapture(interface=interface_name)

  # Connect to SQLite
  db_connection = sqlite3.connect(db_path)
  db_cursor = db_connection.cursor()
  setup_database(db_cursor)

  # Parse live packet data
  for packet in capture.sniff_continuously():
    # Skip non-TCP packets
    if 'TCP' not in packet:
      continue

    # Extract packet data
    stream_no, timestamp, protocols, host_a_ip, host_a_port, host_b_ip, host_b_port, payload = parse_packet(packet)
    fetched_data_stream = stream_exists(db_cursor, stream_no)

    if fetched_data_stream is None:
      data_len = len(payload)

      # Create a new stream entry
      db_cursor.execute('INSERT INTO Streams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
        stream_no,
        timestamp,
        timestamp,
        protocols,
        host_a_ip,
        host_a_port,
        host_b_ip,
        host_b_port,
        data_len,
        sizeof_fmt(data_len),
        payload,
        payload.decode('utf-8', 'ignore')
      ))
    else:
      updated_protocols = fetched_data_stream[3]
      if len(protocols) > len(updated_protocols):
        updated_protocols = protocols

      updated_data_bytes = fetched_data_stream[10] + payload
      updated_data_len = len(updated_data_bytes)

      # Update an existing stream
      db_cursor.execute('''
        UPDATE Streams
        SET end_time = ?,
            protocols = ?,
            data_length = ?,
            data_length_string = ?,
            data_bytes = ?,
            data_printable = ?
        WHERE stream_no = ?
      ''', (
        timestamp,
        updated_protocols,
        updated_data_len,
        sizeof_fmt(updated_data_len),
        updated_data_bytes,
        updated_data_bytes.decode('utf-8', 'ignore'),
        stream_no
      ))

    # Commit changes
    db_connection.commit()

  # Commit any remaining actions and close connection
  db_connection.commit()
  db_connection.close()


class PacketSniffer:
  # Begin of singleton pattern
  class __PacketSniffer:
    def __init__(self):
      pass

    def __str__(self):
      return repr(self)

  instance = None

  def __init__(self):
    if not PacketSniffer.instance:
      PacketSniffer.instance = PacketSniffer.__PacketSniffer()

  def __getattr__(self, name):
    return getattr(self.instance, name)
  # End of singleton pattern

  process: Optional[multiprocessing.Process] = None

  @staticmethod
  def start(interface_name: str, db_path: str):
    print('starting packet sniffer process... ', end='')
    PacketSniffer.process = multiprocessing.Process(target=sniff, args=(interface_name, db_path))
    PacketSniffer.process.start()
    print('DONE')

  @staticmethod
  def terminate():
    if PacketSniffer.process is not None:
      print('terminating packet sniffer process... ', end='')
      PacketSniffer.process.terminate()
      PacketSniffer.process = None
      print('DONE')

  @staticmethod
  def is_running() -> bool:
    return PacketSniffer.process is not None
