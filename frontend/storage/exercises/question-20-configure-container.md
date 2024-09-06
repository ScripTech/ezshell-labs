### Configuring a Container to Start Automatically

* Create a container named "logserver" using the rsyslog image
* Configure it to run as a systemd service that should run from the existing user "xanadu" only
* The service should be named "container-logserver"
* It should automatically start at system reboot without manual intervention
* Copy any *.journal files from the host /var/log/journal directory and any subdirectories into the directory /home/xanadu/container_journal
* Configure the service to automatically mount the directory /home/xanadu/container_journal under /var/log/journal on the container

<!-- #### Expected Result
  - Container "logserver" created and configured
  - Systemd service "container-logserver" set up
  - Automatic start on reboot configured
  - Journal files copied to specified directory
  - Directory mounted in the container as specified -->
