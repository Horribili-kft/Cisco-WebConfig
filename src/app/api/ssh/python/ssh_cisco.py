import paramiko
import sys
import json
import time

def execute_ssh_command(ip, username, password=None, enable_password=None, command=None):
    """
    Executes SSH commands on a Cisco device and returns the output in the desired format.
    """
    result = []  # We'll store the output and errors in this list

    try:
        # Set up SSH client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # Connect to the Cisco switch
        client.connect(ip, username=username, password=password)

        # Open an interactive shell
        shell = client.invoke_shell()
        time.sleep(1)

        # Read initial banner or prompts
        shell.recv(1000)  # Consume any initial output

        # If ">" prompt appears, we need to enter enable mode (privileged exec mode)
        if '>' in shell.recv(1000).decode():
            shell.send('enable\n')
            time.sleep(1)
            # Now handle the enable password prompt
            if enable_password:
                shell.send(f'{enable_password}\n')
                time.sleep(1)
            else:
                raise Exception("Enable password required but not provided.")
            
            # Now we're in privileged mode, expect the '#' prompt
            shell.recv(1000)

        # If commands are provided as a list
        if isinstance(command, list):
            for cmd in command:
                result.append({"type": "command", "content": cmd})
                shell.send(f'{cmd}\n')
                time.sleep(2)  # Give the command time to execute
                output = shell.recv(10000).decode().strip()  # Read command output

                if "invalid" in output.lower():
                    result.append({"type": "error", "content": "Invalid command"})
                else:
                    result.append({"type": "output", "content": output})
        else:
            result.append({"type": "command", "content": command})
            shell.send(f'{command}\n')
            time.sleep(2)
            output = shell.recv(10000).decode().strip()

            if "invalid" in output.lower():
                result.append({"type": "error", "content": "Invalid command"})
            else:
                result.append({"type": "output", "content": output})

        # Close the connection
        client.close()

        # Return only the list (not wrapped in an object)
        return result

    except Exception as e:
        return [{"type": "error", "content": f"An error occurred: {e}"}]


if __name__ == "__main__":
    ip = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3] if len(sys.argv) > 3 else None
    enable_password = sys.argv[4] if len(sys.argv) > 4 else None
    commands = sys.argv[5:] 

    # Execute the SSH command(s)
    result = execute_ssh_command(ip, username, password, enable_password, commands)
    print(json.dumps(result, indent=4))
