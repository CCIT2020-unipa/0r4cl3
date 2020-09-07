from scapy.all import *
import sqlite3
import math
import re

IP_PORT_REGEX = r'((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])):([0-9]+)'


def import_pcap(file_path: str, db_path: str) -> int:
  # Parse PCAP file
  sessions = sniff(offline=file_path, session=TCPSession).sessions()
  sessions = sessions.items()

  # Connect to SQLite
  db_connection = sqlite3.connect(db_path)
  db_cursor = db_connection.cursor()

  # Create the 'Captures' table
  db_cursor.execute('''
    CREATE TABLE IF NOT EXISTS Captures (
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      protocol TEXT NOT NULL,
      src_ip TEXT NOT NULL,
      src_port INTEGER NOT NULL,
      dst_ip TEXT NOT NULL,
      dst_port INTEGER NOT NULL,
      data_length INTEGER NOT NULL,
      data_bytes BLOB NOT NULL,
      data_hex TEXT NOT NULL
    )
  ''')

  for session_name, session_flow in sessions:
    # Skip if session is empty
    if len(session_flow) == 0:
      continue

    # Convert to microseconds from epoch
    start_time = math.floor(session_flow[0].time * 1000000)
    end_time = math.floor(session_flow[-1].time * 1000000)

    # Extract protocol
    protocol = session_name.split(' ')[0]

    # Extract source and destination IPs from session name
    match = re.findall(IP_PORT_REGEX, session_name)
    src_ip = match[0][0]
    src_port = match[0][-1]
    dst_ip = match[1][0]
    dst_port = match[1][-1]

    # Extract TCP flow data
    flow_data_bytes = bytes()
    flow_data_hex = ''

    for session_packet in session_flow:
      if Raw in session_packet:
        data = session_packet[Raw].load

        flow_data_bytes += data
        flow_data_hex += data.hex()

    # Register the extracted data
    db_cursor.execute('INSERT INTO Captures VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
      start_time,
      end_time,
      protocol,
      src_ip,
      src_port,
      dst_ip,
      dst_port,
      len(flow_data_bytes),
      flow_data_bytes,
      flow_data_hex
    ))

  # Commit actions and close connection
  db_connection.commit()
  db_connection.close()

  return len(sessions)
