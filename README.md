# bouzouki

## Startup ##
###`bouzouki` services requirements:###
  _The following commands are implemented for a Debian based Linux machine, but
  can be translated accordingly_

  * rabbitmq service running

  ```
  $ sudo service rabbitmq-server start
  ```
  * celery worker (if not in daemon)

  ```
  $ cd bouzouki/src
  $ celery -A tasks.task_queue worker
  ```
  * celery beat
    * `-s path/to/schedule` is optional

  ```
  $ cd bouzouki/src
  $ celery -A tasks.task_queue beat [-s /home/celery/var/run/celerybeat-schedule]
  ```

### Software Requirements ###
  * Python
  * pip (and included `requirements.txt`)
  * RabbitMQ