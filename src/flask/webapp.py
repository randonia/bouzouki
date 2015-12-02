from elasticsearch import Elasticsearch

from flask import (Flask, request, session, redirect, url_for, abort,
                   flash, jsonify, g)

import json

DEBUG = __name__ == '__main__'
ES_CFG_PATH = '/etc/bouzouki/elasticsearch.json'

es_config_fp = open(ES_CFG_PATH, 'r')
ES_CFG = json.load(es_config_fp)

# Read in the configuration
INDEX_TWEETS = ES_CFG['indices']['tweets']['name']


app = Flask(__name__)

app.config.from_object(__name__)


def initialize_application():
    """
    Initializes the application the first time a request is made
    """
    es = Elasticsearch()
    es.indices.create(index=INDEX_TWEETS, ignore=400)


def make_response(response):
    result = {
        '_links': make_links()
        }
    result.update(response)
    return jsonify(result)


def make_links():
    return {}

# *************
# *** Views ***
# *************


@app.before_first_request
def initialize_application_request():
    """
    Make a call to initialize the application upon the very first request
    """
    initialize_application()


@app.before_request
def request_setup():
    """
    Per-request setup steps to prevent redundant code
    """
    g.es = Elasticsearch()


@app.route('/', methods=['GET'])
def get_index():
    return make_response({})


@app.route('/indices', methods=['DELETE'])
def clear_all_indices():
    """
    Solely for debugging. Only active if DEBUG mode is on. This will call the
    necessary cleanup and reinitialization steps
    """
    if DEBUG:
        g.es.indices.delete(index=INDEX_TWEETS, ignore=[404])
        initialize_application()
        return jsonify({'message': 'success'})
    abort(403)


# *************
# **End Views**
# *************


if __name__ == '__main__':
    app.run(host='0.0.0.0')
