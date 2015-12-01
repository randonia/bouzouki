from task_queue import app

__all__ = (
    'task_pull_feed_from_twitter',
)


@app.task(ignore_result=True)
def task_pull_feed_from_twitter():
    """
    Pull and process data from the public Twitter API
    """
    pass
