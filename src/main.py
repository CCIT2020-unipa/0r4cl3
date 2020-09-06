from flask import Flask, render_template
from os import path

STATIC_FOLDER_PATH = path.join(path.dirname(__file__), '../static')
app = Flask(__name__, static_folder=STATIC_FOLDER_PATH)

@app.route('/')
def hello_world():
  return render_template('index.html')

if __name__ == '__main__':
  # Enable hot reloading for the backend
  app.run(debug=True)
