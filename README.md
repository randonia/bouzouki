# bouzouki

## Startup ##
###`bouzouki` Configuration###
  Copy the configuration files from `bouzouki/cfg` to `/etc/bouzouki`

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
  * Flask web service
    * Can also be run as a wsgi application
    * Serve Flask on `/api` and serve `boukouzi/public_html` with your web server
  ```
  $ cd bouzouki/src
  $ python flask/webapp.py
  ```

### Software Requirements ###
  * Python
  * pip (and included `requirements.txt`)
  * RabbitMQ
  * jQuery 2.1.4 (download [here][1] and include in `public_html/scripts/`

[1]: http://code.jquery.com/jquery-2.1.4.js
