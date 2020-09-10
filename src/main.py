from flask import Flask, render_template
from .api import captures
from os import path
import os
import atexit

from .services.packet_sniffer import PacketSniffer

STATIC_FOLDER_PATH = path.join(path.dirname(__file__), '../static')
DB_PATH = './captures.db'
CAPTURES_INTERFACE = 'en1'

app = Flask(__name__, static_folder=STATIC_FOLDER_PATH)
app.register_blueprint(captures, url_prefix='/api')

@app.route('/', defaults={ 'path': '' })
@app.route('/<path:path>')
def _index(path):
  return render_template('index.html')


def on_program_exit():
  # Terminate the packets capturing service
  PacketSniffer().terminate()


if __name__ == '__main__':
  if os.geteuid() != 0:
    print('this server requires root privileges to run')
    exit(1)

  # Register a clean-up function
  atexit.register(on_program_exit)

  # Start the packets capturing service
  PacketSniffer().start(CAPTURES_INTERFACE, DB_PATH)

  # Start flask backend
  app.run()
