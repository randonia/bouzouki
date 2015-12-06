from elasticsearch import Elasticsearch
from Geohash import geohash
from urlparse import urljoin
from flask import (Flask, request, session, redirect, url_for, abort,
                   flash, jsonify, g)

import json
import re

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
    return jsonify(response)


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


def parse_request_args(args):
    lat = args.get('lat', None)
    lon = args.get('lon', None)
    precision = args.get('precision', None)
    return (lat, lon, precision)


def get_hashtags_args(args):
    """
    Helper function to take an request dictionary and extract the
    hashtag-specific url paramaters
    """
    query = args.get('hashtags', '')
    # Match against several kinds of trueness
    is_local_only = (args.get('local_tags_only', False)
                     in [True, 'true', 'True', 1, '1'])
    hashtag_finder = r'#\w\w+'
    # Chop off the opening '#' symbol via lambda
    detected_tags = map(lambda tag: tag[1:], re.findall(hashtag_finder, query))

    return detected_tags, is_local_only


def get_precision_from_raw(precision_raw):
    # This isn't very clean but not knowing anything but the rough radius
    # means converting using messy conversions just using widths in kilometers
    precision_values = [5009, 1252, 156, 39, 3.9, 1.2, 0.152]
    for index, precision in enumerate(precision_values):
        if precision_raw > precision:
            return index
    return len(precision_values)


@app.route('/tweet_feed', methods=['GET'])
def get_tweet_feed():
    """
    Tweet Feed just provides the 15 most recent tweets if no parameters are
    passed in, otherwise provides locational tweets.
    """
    hits = []
    search_body = None
    # Process the parameters
    geo_params = parse_request_args(request.args)
    # Enforce mandatory geographic information
    if None not in geo_params:
        lat, lon, precision_raw = map(float, geo_params)
        precision = get_precision_from_raw(precision_raw)
        geo = geohash.encode(lat, lon, precision)

        # The sorting - root.sort
        sorting_terms_array = [
            {
                '_geo_distance': {
                    'geo': {
                        'lat': lat,
                        'lon': lon
                        },
                    'order': 'asc',
                    'unit': 'km',
                    'distance_type': 'plane'
                    }
                }
            ]

        # The list of should matches - root.query.filtered.query.bool.should
        # The array of OR'd hashtags to support multi-tag search
        tag_should_array = []

        # Add in any hashtags
        hashtags_to_search, local_search_only = get_hashtags_args(request.args)
        if len(hashtags_to_search) > 0:
            # Append every hashtag into the should array
            tag_should_array += [{'match': {'hashtags': tag}}
                                 for tag in hashtags_to_search]

        # The query - root.query.filtered.query
        # Used for querying hashtags.
        body_query = {
            'bool': {
                'should': tag_should_array
                }
            }

        # The filter - root.query.filtered.filter
        # Filtering using geohash_cell
        body_filter = {
            'geohash_cell': {
                'geo': {
                    'lat': lat,
                    'lon': lon
                    },
                'precision': precision,
                'neighbors': True
                }
            }

        # Clear the body filter if we should only be parsing local searches
        restrict_search = len(hashtags_to_search) > 0 and local_search_only or\
            len(hashtags_to_search) == 0

        if not restrict_search:
            body_filter = {}

        search_body = {
            'sort': sorting_terms_array,
            'query': {
                'filtered': {
                    'filter': body_filter,
                    'query': body_query
                    }
                }
            }

        # This really should be paginated using from_
        result = g.es.search(index='tweets', size=250, body=search_body)
        hits = [build_hit(hit) for hit in result['hits']['hits']]

        return make_response({'_count': len(hits), '_took': result['took'],
                              'hits': hits})

    # if we have bad geo params, give back nothing
    return make_response({'hits': [], '_took': 0})


@app.route('/indices', methods=['DELETE'])
def clear_all_indices():
    """
    Solely for debugging. Only active if DEBUG mode is on. This will call the
    necessary cleanup and reinitialization steps
    """
    # Remove 'and False' to re-enable this. Added as a failsafe to
    # prevent index deletion
    if DEBUG and False:
        reset_application()
        return jsonify({'message': 'success'})
    abort(403)

# *************
# **End Views**
# *************


if __name__ == '__main__':
    app.run(host='0.0.0.0')
