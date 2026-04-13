# What is SCP :

**SCP stands for `Secure Copy Protocol` (or Secure Copy).**

- `SCP (Secure Copy Protocol)` is a command-line utility used to securely transfer files and directories between a local host and a remote host, or between two remote hosts.

- It operates over an SSH connection, leveraging its authentication and encryption features to ensure data confidentiality during transit.

# Command for copy a file:

- #### File Transfer: windows to ubuntu

```powershell
scp src_path username@[ipv6_address]:dst_path
```

- #### File Transfer: ubuntu to windows

```powershell
scp username@[ipv6_address]:src_path dst_path 
```

