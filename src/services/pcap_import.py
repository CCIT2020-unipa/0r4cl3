from typing import Optional
import sqlite3
import pyshark
import math

IGNORED_PROTOCOLS = ('data', 'data-text-lines', 'gsm_abis_rsl', 'gsm_ipa', 'irc')


# Source: https://stackoverflow.com/a/1094933
def sizeof_fmt(num, suffix='B'):
  for unit in ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z']:
    if abs(num) < 1024.0:
      return "%3.1f%s%s" % (num, unit, suffix)
    num /= 1024.0
  return "%.1f%s%s" % (num, 'Y', suffix)


def parse_packet(packet) -> (int, float, [str], str, str, str, str, Optional[bytes]):
  # Convert to microseconds from epoch
  timestamp = math.floor(float(packet.frame_info.time_epoch) * 1000000)

  # Extract source and destination information
  host_a_ip = packet['ip'].src
  host_a_port = packet['tcp'].srcport
  host_b_ip = packet['ip'].dst
  host_b_port = packet['tcp'].dstport

  # Extract protocol
  protocols = filter(lambda protocol: protocol not in IGNORED_PROTOCOLS, packet.frame_info.protocols.split(':'))
  protocols = list(protocols)

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


def import_pcap(file_path: str, db_path: str) -> int:
  # Parse PCAP file
  capture = pyshark.FileCapture(file_path)
  streams = {}

  while True:
    try:
      # Extract packet data
      stream_no, timestamp, protocols, host_a_ip, host_a_port, host_b_ip, host_b_port, payload = parse_packet(capture.next())

      if stream_no not in streams:
        # Create a new stream entry
        streams[stream_no] = {
          'start_time': timestamp,
          'end_time': timestamp,
          'protocols': protocols,
          'host_a_ip': host_a_ip,
          'host_a_port': host_a_port,
          'host_b_ip': host_b_ip,
          'host_b_port': host_b_port,
          'data_length': len(payload),
          'data_bytes': payload
        }
      else:
        # Update the packet's stream data
        streams[stream_no]['end_time'] = timestamp
        streams[stream_no]['data_length'] += len(payload)
        streams[stream_no]['data_bytes'] += payload

        # Use the highest level protocol
        if len(protocols) > len(streams[stream_no]['protocols']):
          streams[stream_no]['protocols'] = protocols
    except StopIteration:
      break

  # Connect to SQLite
  db_connection = sqlite3.connect(db_path)
  db_cursor = db_connection.cursor()

  # Create the 'Captures' table
  db_cursor.execute('''
    CREATE TABLE IF NOT EXISTS Captures (
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      protocol TEXT NOT NULL,
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

  # Create the 'CapturesIndex' table to perform full-text queries
  db_cursor.execute('''
    CREATE VIRTUAL TABLE IF NOT EXISTS CapturesIndex USING fts5(data_printable, tokenize=porter)
  ''')

  # Keep 'Captures' and 'CapturesIndex' tables in sync using triggers
  # Trigger on INSERT
  db_cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS OnCapturesInsert AFTER INSERT ON Captures BEGIN
      INSERT INTO CapturesIndex(rowid, data_printable) VALUES (new.rowid, new.data_printable);
    END
  ''')

  # Trigger on UPDATE
  db_cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS OnCapturesUpdate UPDATE OF data_printable ON Captures BEGIN
      UPDATE CapturesIndex SET data_printable = new.data_printable WHERE rowid = old.rowid;
    END
  ''')

  # Trigger on DELETE
  db_cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS OnCapturesDelete AFTER DELETE ON Captures BEGIN
      DELETE FROM CapturesIndex WHERE rowid = old.rowid;
    END
  ''')

  # Register streams
  for _, stream in streams.items():
    db_cursor.execute('INSERT INTO Captures VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
      stream['start_time'],
      stream['end_time'],
      stream['protocols'][-1],
      stream['host_a_ip'],
      stream['host_a_port'],
      stream['host_b_ip'],
      stream['host_b_port'],
      stream['data_length'],
      sizeof_fmt(stream['data_length']),
      stream['data_bytes'],
      stream['data_bytes'].decode('utf-8', 'ignore')
    ))

  # Commit actions and close connection
  db_connection.commit()
  db_connection.close()

  return len(streams.keys())
