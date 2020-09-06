from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def hello_world():
  return render_template('index.html')

if __name__ == '__main__':
  # Enable hot reloading for the backend
  app.run(debug=True)
