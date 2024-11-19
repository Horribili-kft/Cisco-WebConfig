import paramiko
import sys
import json

def execute_ssh_command(ip, username, password=None, command=None):
    """
    Executes SSH commands on a remote server and returns the output in the desired format.
    """
    result = []  # We'll store the output and errors in this list

    try:
        # Set up SSH client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # Connect to the server using password authentication
        client.connect(ip, username=username, password=password)

        # If commands are provided as a list
        if isinstance(command, list):
            for cmd in command:
                result.append({"type": "command", "content": cmd}) 
                stdin, stdout, stderr = client.exec_command(cmd)
                output = stdout.read().decode().strip()
                error = stderr.read().decode().strip()

                if error:
                    result.append({"type": "error", "content": error})
                else:
                    result.append({"type": "output", "content": output})
        else:
            result.append({"type": "command", "content": command})
            stdin, stdout, stderr = client.exec_command(command)
            output = stdout.read().decode().strip()
            error = stderr.read().decode().strip()

            if error:
                result.append({"type": "error", "content": error})
            else:
                result.append({"type": "output", "content": output})

        # Close the connection
        client.close()

        # Return only the list (not wrapped in an object)
        return result

    except Exception as e:
        return [{"type": "error", "content": f"An error occurred: {e}"}]

if __name__ == "__main__":
    # ssh_linux ip username password "command 1" "command 2" ...
    # Ex.: python .\src\app\api\ssh\python\ssh_linux.py 10.0.116.25 root a "ls -la"
    ip = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3] if len(sys.argv) > 3 else None
    commands = sys.argv[4:]  # Take multiple commands if they exist

    # Execute the SSH command(s)
    result = execute_ssh_command(ip, username, password, commands)
    print(json.dumps(result, indent=4))