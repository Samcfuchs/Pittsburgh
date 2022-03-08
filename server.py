from flask import *
from whitenoise import WhiteNoise

app = Flask(__name__, static_url_path='', static_folder='/static')
app.wsgi_app = WhiteNoise(app.wsgi_app, 
                          root='static/', 
                          prefix='static/', 
                          index_file='index.html', 
                          autorefresh=True)

@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('/static/index.html')
    
if __name__ == "__main__":
    app.run(threaded=True, port=5000)
