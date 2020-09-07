from flask import Flask, render_template
from .api import captures
from os import path

# from .services.pcap_import import import_pcap

STATIC_FOLDER_PATH = path.join(path.dirname(__file__), '../static')
PCAP_PATH = './test_captures/dump-2018-06-27_13_25_31.pcap'
DB_PATH = './captures.db'

app = Flask(__name__, static_folder=STATIC_FOLDER_PATH)
app.register_blueprint(captures, url_prefix='/api')

@app.route('/', defaults={ 'path': '' })
@app.route('/<path:path>')
def _index(path):
  return render_template('index.html')


if __name__ == '__main__':
  # print(f'importing {PCAP_PATH} ...')
  # n_sessions = import_pcap(PCAP_PATH, DB_PATH)
  # print(f'imported {n_sessions} sessions')

  # Enable hot reloading for the backend
  app.run(debug=True)
