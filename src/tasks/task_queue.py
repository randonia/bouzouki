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


# Set a non-timeout configuration
app.conf.update(
    CELERY_TASK_RESULT_EXPIRES=None
)

if __name__ == '__main__':
    app.start()
