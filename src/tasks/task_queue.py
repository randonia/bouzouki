from celery import Celery
from datetime import timedelta
from elasticsearch import Elasticsearch

__all__ = (
    'app',
)

CONFIG = {
    'broker': 'amqp://guest@localhost//'
}

app = Celery('tasks',
             backend='amqp',
             broker=CONFIG['broker'],
             include=['tasks.twitter_tasks'])

# Set up the scheduled task to pull the feed
schedule = {
    'pull_twitter_feed': {
        'task': 'tasks.twitter_tasks.task_pull_feed_from_twitter',
        'schedule': timedelta(minutes=1),
        'args': None
    }
}

# Enforce a timeout
app.conf.update(
    CELERY_TASK_RESULT_EXPIRES=3600,
    CELERYBEAT_SCHEDULE=schedule
)

if __name__ == '__main__':
    app.start()
