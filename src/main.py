from flask import Flask, render_template
from .api import streams, sniffer, auth
from os import path
import os
import atexit

from .services.packet_sniffer import PacketSniffer
from .services.sqlite_database import SQLiteDatabase

STATIC_FOLDER_PATH = path.join(path.dirname(__file__), '../static')
DB_PATH = './data.db'

app = Flask(__name__, static_folder=STATIC_FOLDER_PATH)
app.register_blueprint(streams, url_prefix='/api')
app.register_blueprint(sniffer, url_prefix='/api')
app.register_blueprint(auth, url_prefix='/api')

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
  if 'ACCESS_TOKEN' not in os.environ:
    print('0r4cl3 requires the environment variable "ACCESS_TOKEN" to be set in order to authenticate users')
    exit(1)

  if 'SNIFFER_INTERFACE' not in os.environ:
    print('0r4cl3 requires the environment variable "SNIFFER_INTERFACE" to be set in order to capture network traffic')
    exit(1)

  if os.geteuid() != 0:
    print('0r4cl3 requires root privileges to run')
    exit(1)

  # Perform DB setup operations
  SQLiteDatabase().setup(DB_PATH)

  # Register a clean-up function
  atexit.register(on_program_exit)

  # Start the packet sniffer service
  PacketSniffer().start(os.environ['SNIFFER_INTERFACE'])

  # Start flask backend
  app.run()
