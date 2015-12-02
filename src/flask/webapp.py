from elasticsearch import Elasticsearch
from urlparse import urljoin
from flask import (Flask, request, session, redirect, url_for, abort,
                   flash, jsonify, g)

import json

DEBUG = __name__ == '__main__'
ES_CFG_PATH = '/etc/bouzouki/elasticsearch.json'
ES_DOCUMENT_PATH = '/etc/bouzouki/es_documents.json'

es_config_fp = open(ES_CFG_PATH, 'r')
ES_CFG = json.load(es_config_fp)
es_config_fp.close()
es_document_fp = open(ES_DOCUMENT_PATH, 'r')
ES_DOCUMENT = json.load(es_document_fp)
es_document_fp.close()

# Read in the configuration
INDEX_TWEETS = ES_CFG['indices']['tweets']['name']


app = Flask(__name__)

app.config.from_object(__name__)


def reset_application():
    """
    Only call this if debug is active!
    """
    if not DEBUG:
        print 'Attempted to call reset without DEBUG set, aborting'
        return
    es = Elasticsearch()
    es.indices.delete(index=INDEX_TWEETS, ignore=[404])
    initialize_application()


def initialize_application():
    """
    Initializes the application the first time a request is made
    """
    es = Elasticsearch()
    es.indices.create(index=INDEX_TWEETS, ignore=400, body=ES_DOCUMENT)


def make_response(response, **kwargs):
    result = {
        '_links': make_links(kwargs)
        }
    result.update(response)
    return jsonify(result)


def make_links(args):
    url_path = request.url_root, 'api' + request.path
    return {'self': {'href': url_path}}


def build_hit(hit):
    """
    Call build_hit on a per-hit basis to normalize construction of a hit result
    from elasticsearch
    """
    return hit['_source']

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


@app.route('/tweet_feed', methods=['GET'])
def get_tweet_feed():
    """
    Tweet Feed just provides the 15 most recent tweets. Used primarily for
    testing frontend results to prevent requiring any complex items
    """
    result = g.es.search(index='tweets', size=15, sort=['date:desc'])
    hits = [build_hit(hit) for hit in result['hits']['hits']]
    return make_response({'hits': hits})


@app.route('/indices', methods=['DELETE'])
def clear_all_indices():
    """
    Solely for debugging. Only active if DEBUG mode is on. This will call the
    necessary cleanup and reinitialization steps
    """
    if DEBUG:
        reset_application()
        return jsonify({'message': 'success'})
    abort(403)

# *************
# **End Views**
# *************


if __name__ == '__main__':
    app.run(host='0.0.0.0')
