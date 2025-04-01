### Configuring YUM Repository

Configure your servera VM repository. The packages distribution should be available via YUM at `devops.repo` file:

Note: It's important that the name of the repo file is: `devops.repo`

* Name = DevOps-BaseOS
* Name = DevOps-AppStream

* Base OS URL = http://content.example.com/rhel8.0/x86_64/dvd/BaseOs
* App Stream URL = http://content.example.com/rhel8.0/x86_64/dvd/Appstream

<!-- #### Expected Result
- YUM repository configured with the provided URLs
- Ability to install packages from these repositories -->
