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
            payload = {
                'author': {
                    'avatar_url': status.author.profile_image_url,
                    'name': status.author.name
                    },
                'geo': {
                    'lon': status.coordinates['coordinates'][0],
                    'lat': status.coordinates['coordinates'][1]
                },
                'text': status.text,
                'num_retweets': status.retweet_count,
                'source_url': status.source_url,
                'id': status.id,
                'date': status.timestamp_ms
            }
            self.es.index(index='tweets', doc_type='tweets', body=payload)
