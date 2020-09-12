from flask import Flask, render_template
from .api import streams, sniffer
from os import path
import os
import atexit

from .services.packet_sniffer import PacketSniffer
from .services.sqlite_database import SQLiteDatabase

STATIC_FOLDER_PATH = path.join(path.dirname(__file__), '../static')
SNIFFER_INTERFACE = 'en1'
DB_PATH = './data.db'

app = Flask(__name__, static_folder=STATIC_FOLDER_PATH)
app.register_blueprint(streams, url_prefix='/api')
app.register_blueprint(sniffer, url_prefix='/api')

@app.route('/', defaults={ 'path': '' })
@app.route('/<path:path>')
def _index(path):
  return render_template('index.html')


def on_program_exit():
  # Terminate the packet sniffer service
  PacketSniffer().terminate()

  # Close DB connection
  SQLiteDatabase().close()


if __name__ == '__main__':
  if os.geteuid() != 0:
    print('this server requires root privileges to run')
    exit(1)

  # Perform DB setup operations
  SQLiteDatabase().setup(DB_PATH)

  # Register a clean-up function
  atexit.register(on_program_exit)

  # Start the packet sniffer service
  PacketSniffer().start(SNIFFER_INTERFACE)

  # Start flask backend
  app.run()
