import tweepy

from datetime import datetime
import json

from task_queue import app
from utils.twitter import CoordinateIndexingStreamListener

__all__ = (
    'task_read_stream_from_twitter',
)

TWITTER_CFG_PATH = '/etc/bouzouki/twitter_auth.json'


@app.task(ignore_result=True)
def task_read_stream_from_twitter():
    cfg = None
    try:
        config_file = open(TWITTER_CFG_PATH, 'r')
        cfg = json.load(config_file)
    except IOError as e:
        raise Exception('Unable to locate %s' % TWITTER_CFG_PATH)
    except ValueError as e:
        raise Exception('Unable to parse %s' % TWITTER_CFG_PATH)

    if None in [cfg.get('consumer_key'), cfg.get('consumer_secret'),
                cfg.get('access_token'), cfg.get('access_token_secret')]:
        raise ValueError('Missing valid configuration')

    auth = tweepy.OAuthHandler(cfg['consumer_key'], cfg['consumer_secret'])
    auth.set_access_token(cfg['access_token'], cfg['access_token_secret'])

    api = tweepy.API(auth)

    stream_listener = CoordinateIndexingStreamListener()
    try:
        stream = tweepy.Stream(auth=api.auth, listener=stream_listener)
        stream.sample()
    except Exception as exc:
        raise self.retry(exc=exc)
