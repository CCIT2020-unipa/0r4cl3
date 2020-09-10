from flask import Flask, render_template
from .api import captures
from os import path
import os
import atexit

# from .services.pcap_import import import_pcap
from .services.pcap_generator import PcapGenerator

CAPTURES_OUTPUT_FOLDER_PATH = path.join(path.dirname(__file__), '../captures')
CAPTURES_INTERFACE = 'en1'
CAPTURES_INTERVAL = 60
DB_PATH = './captures.db'
STATIC_FOLDER_PATH = path.join(path.dirname(__file__), '../static')
PCAP_PATH = './test_captures/dump-2018-06-27_13_25_31.pcap'

app = Flask(__name__, static_folder=STATIC_FOLDER_PATH)
app.register_blueprint(captures, url_prefix='/api')

@app.route('/', defaults={ 'path': '' })
@app.route('/<path:path>')
def _index(path):
  return render_template('index.html')


def on_program_exit():
  # Terminate the packets capturing service
  PcapGenerator().terminate()


if __name__ == '__main__':
  if os.geteuid() != 0:
    print('this server requires root privileges to run')
    exit(1)

  # print(f'importing {PCAP_PATH} ...')
  # n_sessions = import_pcap(PCAP_PATH, DB_PATH)
  # print(f'imported {n_sessions} sessions')

  # Register a clean-up function
  atexit.register(on_program_exit)

  # Start the packets capturing service
  PcapGenerator().start(CAPTURES_INTERFACE, CAPTURES_INTERVAL, CAPTURES_OUTPUT_FOLDER_PATH)

  # Enable hot reloading for the backend
  app.run(debug=True)
