from elasticsearch import Elasticsearch
import tweepy


class CoordinateIndexingStreamListener(tweepy.StreamListener):
    """
    A Tweepy stream listener which reads a stream from Tweepy and indexes all
    tweets which contain coordinates into Elasticsearch
    """
    def __init__(self):
        super(CoordinateIndexingStreamListener, self).__init__()
        self.es = Elasticsearch()

    def on_status(self, status):
        if status.coordinates:
            print status
