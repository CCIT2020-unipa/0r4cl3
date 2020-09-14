from typing import Tuple, Optional
import multiprocessing
import collections
import pyshark
import math

from ..services.sqlite_database import SQLiteDatabase

IGNORED_PROTOCOLS = ('data', 'data-text-lines', 'gsm_abis_rsl', 'gsm_ipa', 'irc')
StreamFragment = collections.namedtuple(
  'StreamFragment',
  'stream_no sub_stream_no timestamp protocols src_ip src_port dst_ip dst_port data'
)

class EmptyPayloadException(Exception):
  pass

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
    PacketSniffer.process = multiprocessing.Process(target=PacketSniffer.__sniff, args=(interface_name,))
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

  @staticmethod
  def __sniff(interface_name: str):
    try:
      # Start live sniffing
      capture = pyshark.LiveCapture(interface=interface_name)

      # Parse live packet data
      for packet in capture.sniff_continuously():
        # Skip non-TCP packets
        if 'TCP' not in packet:
          continue

        try:
          # Create a new stream fragment entry
          stream_fragment = PacketSniffer.__parse_stream_fragment(packet)
          SQLiteDatabase().execute(
            'INSERT INTO StreamFragments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            stream_fragment.stream_no,
            stream_fragment.sub_stream_no,
            stream_fragment.timestamp,
            stream_fragment.protocols,
            stream_fragment.src_ip,
            stream_fragment.src_port,
            stream_fragment.dst_ip,
            stream_fragment.dst_port,
            stream_fragment.data
          )
        except EmptyPayloadException:
          # Skip packets with empty payload
          pass
    except KeyboardInterrupt:
      # Gracefully terminate the packet sniffer service
      print()
      print('keyboard interrupt received, ready to terminate packet sniffer process')

  @staticmethod
  def __latest_stream_fragment(stream_no: int) -> Tuple[int, str]:
    db_cursor = SQLiteDatabase().execute('''
      SELECT sub_stream_no,
             src_ip
      FROM StreamFragments INNER JOIN OldestNewestStreamFragments ON
           StreamFragments.stream_no = OldestNewestStreamFragments.stream_no AND
           StreamFragments.timestamp = OldestNewestStreamFragments.newest_timestamp
      WHERE OldestNewestStreamFragments.stream_no = ?
    ''', stream_no)
    fetched_stream_fragment = db_cursor.fetchone()

    if fetched_stream_fragment is None:
      return 0, ''
    else:
      return fetched_stream_fragment['sub_stream_no'], fetched_stream_fragment['src_ip']

  @staticmethod
  def __parse_stream_fragment(packet) -> StreamFragment:
    # Convert to microseconds from epoch
    timestamp = math.floor(float(packet.frame_info.time_epoch) * 1000000)

    # Extract source and destination information
    src_ip = packet['ip'].src
    src_port = packet['tcp'].srcport
    dst_ip = packet['ip'].dst
    dst_port = packet['tcp'].dstport

    # Filter protocols to ignore
    # TODO: improve filtering
    protocols = filter(lambda protocol: protocol not in IGNORED_PROTOCOLS, packet.frame_info.protocols.split(':'))
    protocols = ':'.join(list(protocols))

    # Extract payload data
    if hasattr(packet['tcp'], 'payload'):
      payload = packet['tcp'].payload.binary_value
    else:
      raise EmptyPayloadException

    # Extract stream number
    stream_no = int(packet['tcp'].stream)

    # Compute sub-stream number
    latest_sub_stream_no, latest_src_ip = PacketSniffer.__latest_stream_fragment(stream_no)
    if src_ip == latest_src_ip:
      sub_stream_no = latest_sub_stream_no
    else:
      sub_stream_no = latest_sub_stream_no + 1

    return StreamFragment(
      stream_no=stream_no,
      sub_stream_no=sub_stream_no,
      timestamp=timestamp,
      protocols=protocols,
      src_ip=src_ip,
      src_port=src_port,
      dst_ip=dst_ip,
      dst_port=dst_port,
      data=payload
    )
