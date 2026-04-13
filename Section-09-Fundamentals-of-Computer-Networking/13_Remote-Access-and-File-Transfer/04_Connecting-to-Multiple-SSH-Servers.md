# Connecting to Multiple SSH Servers

For connecting multiple server we need to some configuration in our .ssh folder

1. Create config file
2. Create multiple Host with specific name wit HostName, User, and IdentityFile name

3. ssh directly with server name in client machine.

#### Example:

```config
Host wsl-server
  HostName ipv4/ipv6
  User <userName>
  IdentityFile <FilePath>
```
