from typing import Tuple, Optional, Any
import multiprocessing
import pyshark
import math

from ..services.sqlite_database import SQLiteDatabase

IGNORED_PROTOCOLS = ('data', 'data-text-lines', 'gsm_abis_rsl', 'gsm_ipa', 'irc')

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


def stream_exists(stream_no: int) -> Optional[Any]:
  return SQLiteDatabase.execute('SELECT * FROM Streams WHERE stream_no = ?', stream_no).fetchone()


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


def sniff(interface_name: str):
  try:
    # Start live sniffing
    capture = pyshark.LiveCapture(interface=interface_name)

    # Parse live packet data
    for packet in capture.sniff_continuously():
      # Skip non-TCP packets
      if 'TCP' not in packet:
        continue

      # Extract packet data
      stream_no, timestamp, protocols, host_a_ip, host_a_port, host_b_ip, host_b_port, payload = parse_packet(packet)
      fetched_data_stream = stream_exists(stream_no)

      if fetched_data_stream is None:
        data_len = len(payload)

        # Create a new stream entry
        SQLiteDatabase().execute(
          'INSERT INTO Streams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        )
      else:
        updated_protocols = fetched_data_stream['protocols']
        if len(protocols) > len(updated_protocols):
          updated_protocols = protocols

        updated_data_bytes = fetched_data_stream['data_bytes'] + payload
        updated_data_len = len(updated_data_bytes)

        # Update an existing stream
        SQLiteDatabase().execute(
          '''
            UPDATE Streams
            SET end_time = ?,
                protocols = ?,
                data_length = ?,
                data_length_string = ?,
                data_bytes = ?,
                data_printable = ?
            WHERE stream_no = ?
          ''',
          timestamp,
          updated_protocols,
          updated_data_len,
          sizeof_fmt(updated_data_len),
          updated_data_bytes,
          updated_data_bytes.decode('utf-8', 'ignore'),
          stream_no
        )
  except KeyboardInterrupt:
    # Gracefully terminate the packet sniffer service
    print()
    print('keyboard interrupt received, ready to terminate packet sniffer process')


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
  def start(interface_name: str):
    print('starting packet sniffer process... ', end='')
    PacketSniffer.process = multiprocessing.Process(target=sniff, args=(interface_name,))
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
