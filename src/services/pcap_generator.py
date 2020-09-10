from subprocess import Popen
from shutil import which
from pathlib import Path
from os import path
import psutil


class PcapGenerator:
  # Begin of singleton pattern
  class __PcapGenerator:
    def __init__(self):
      pass

    def __str__(self):
      return repr(self)

  instance = None

  def __init__(self):
    if not PcapGenerator.instance:
      PcapGenerator.instance = PcapGenerator.__PcapGenerator()

  def __getattr__(self, name):
    return getattr(self.instance, name)
  # End of singleton pattern

  @staticmethod
  def start(interface_name: str, time_interval: int, output_folder_path: str):
    # Skip if another tcpdump process is already capturing packets
    if PcapGenerator.is_running():
      print('tcpdump is already running')
      return

    if which('tcpdump') is None:
      print('tcpdump must be installed to capture packets')
      exit(1)

    # Create output folder if it doesn't exist
    output_folder_path = path.abspath(output_folder_path)
    Path(output_folder_path).mkdir(parents=True, exist_ok=True)

    # Run tcpdump
    print('starting a new tcpdump process... ', end='')
    Popen([
      'tcpdump',
      '-i', interface_name,
      '-G', str(time_interval),                                     # Output PCAP at a regular interval
      '-w', f'{output_folder_path}/capture-%Y-%m-%d_%H:%M:%S.pcap'  # Output file path
    ])
    print('DONE')

  @staticmethod
  def terminate():
    for p in psutil.process_iter():
      if 'tcpdump' in p.name():
        print(f'terminating tcpdump process with PID {p.pid}... ', end='')
        p.terminate()
        print('DONE')

  @staticmethod
  def is_running() -> bool:
    return 'tcpdump' in (p.name() for p in psutil.process_iter())
