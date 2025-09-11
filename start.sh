#!/bin/sh

# Wait for a moment to ensure everything is ready
sleep 2

# Start supervisor (which manages both backend and nginx)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf 