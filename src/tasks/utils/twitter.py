from elasticsearch import Elasticsearch
from Geohash import geohash
import re
import tweepy


class CoordinateIndexingStreamListener(tweepy.StreamListener):
    """
    A Tweepy stream listener which reads a stream from Tweepy and indexes all
    tweets which contain coordinates into Elasticsearch
    """
    def __init__(self):
        super(CoordinateIndexingStreamListener, self).__init__()
        self.es = Elasticsearch()
        self.PRECISION = 9

    def detect_hashtags(self, text):
        r_hashtag_finder = r'#\w\w+'
        return re.findall(r_hashtag_finder, text)

    def on_status(self, status):
        if status.coordinates:
            lon, lat = status.coordinates['coordinates']
            author = status.author
            hashtags = self.detect_hashtags(status.text)
            payload = {
                'author': {
                    'avatar_url': author.profile_image_url,
                    'name': author.name,
                    'handle': author.screen_name,
                    'profile_text_color': author.profile_text_color,
                    'profile_background_color': author.profile_background_color
                    },
                'geo': geohash.encode(lat, lon, self.PRECISION),
                'text': status.text,
                'num_retweets': status.retweet_count,
                'source_url': status.source_url,
                'id': status.id_str,
                'date': status.timestamp_ms,
                'hashtags': hashtags
            }
            self.es.index(index='tweets', doc_type='tweets', body=payload)
