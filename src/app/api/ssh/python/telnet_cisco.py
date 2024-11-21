# This is so that Python doesn't complain that telnetlib is going to be removed in python 3.13 (If you are using that version, that is why the program is failing. Use a compiled version)
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning) 

import telnetlib
import time
import json
import sys

# Global timeout variable
TIMEOUT = 10  # Timeout in seconds, adjustable for all operations
ENABLE_LOGGING = False  # Set to True to enable logging, False to disable

def log(message):
    """Helper function for logging, based on ENABLE_LOGGING."""
    if ENABLE_LOGGING:
        print(message)

def telnet_connect(host, port=23, timeout=TIMEOUT):
    """Establish a connection to the Telnet server."""
    start_time = time.time()  # Define start_time at the beginning of the connection attempt
    try:
        tn = telnetlib.Telnet(host, port, timeout)
        log(f"[Telnet connection established] - Time taken: {time.time() - start_time:.4f} seconds")
        return tn
    except Exception as e:
        return {'type': 'error', 'content': f"Telnet: Failed to connect: {str(e)}"}

def login_to_server(tn, username, password, timeout=TIMEOUT):
    """Handle login with the correct prompts and wait for the Cisco prompt."""
    try:
        # Wait for the login prompt and send the username
        log("Waiting for login prompt: Username:")
        start_login_time = time.time()
        tn.read_until(b"Username:", timeout=timeout)  # Wait for "Username:" prompt
        log(f"Time to find login prompt 'Username:': {time.time() - start_login_time:.4f} seconds")
        tn.write(username.encode('ascii') + b"\n")

        # Wait for password prompt and send the password
        log("Waiting for password prompt: Password:")
        start_password_time = time.time()
        tn.read_until(b"Password:", timeout=timeout)  # Wait for "Password:" prompt
        log(f"Time to find password prompt 'Password:': {time.time() - start_password_time:.4f} seconds")
        tn.write(password.encode('ascii') + b"\n")

        # Wait for the final prompt, which should be # (privileged EXEC mode)
        log("Waiting for privileged EXEC mode prompt (#):")
        start_prompt_time = time.time()
        output = tn.read_until(b"#", timeout=timeout)  # Wait for the # prompt indicating login is successful
        log(f"Time to find privileged EXEC mode prompt '#': {time.time() - start_prompt_time:.4f} seconds")

        # Send the terminal length 0 command to disable paging
        log("Disabling paging with terminal length 0...")
        tn.write(b"terminal length 0\n")

        # Wait for the prompt again to ensure we are ready for the next command
        log("Waiting for prompt after disabling paging...")
        tn.read_until(b"#", timeout=timeout)

        return True
    except Exception as e:
        return {'type': 'error', 'content': f"Login failed: {str(e)}"}

def send_command(tn, command, sleep_time=1, timeout=TIMEOUT):
    """Send a command to the Telnet server and return the output."""
    try:
        tn.write(command.encode('ascii') + b"\n")  # Send the command
        time.sleep(sleep_time)  # Wait for a response
        output = tn.read_very_eager().decode('ascii', errors='ignore')  # Read the response
        if "Invalid" in output or "Error" in output:
            return {'type': 'error', 'content': output.strip()}
        return {'type': 'output', 'content': output.strip()}
    except EOFError:
        return {'type': 'error', 'content': 'Telnet: Connection lost or EOF encountered'}
    except Exception as e:
        return {'type': 'error', 'content': f"Telnet: Error sending command: {str(e)}"}

def telnet_session(host, username, password, commands, timeout=TIMEOUT):
    """Connect to Telnet server, run a list of commands, and return the TerminalEntry JSON."""
    terminal_entries = []

    # Try connecting to the Telnet server
    start_time = time.time()
    connection_result = telnet_connect(host, port=23, timeout=timeout)
    if isinstance(connection_result, dict) and connection_result['type'] == 'error':
        terminal_entries.append(connection_result)
        print(json.dumps(terminal_entries))  # Dump error immediately
        sys.exit(1)

    tn = connection_result

    # Handle login process
    login_result = login_to_server(tn, username, password, timeout)
    if isinstance(login_result, dict) and login_result['type'] == 'error':
        terminal_entries.append(login_result)
        print(json.dumps(terminal_entries))  # Dump error immediately
        sys.exit(1)

    # If no commands are provided, just return whether the login was successful
    if not commands:
        terminal_entries.append({'type': 'output', 'content': f'Telnet: Successfully connected to {host}'})
    else:
        # Run the list of commands
        for command in commands:
            terminal_entries.append({'type': 'command', 'content': command})
            result = send_command(tn, command, timeout=timeout)
            terminal_entries.append(result)

    tn.close()

    return terminal_entries

if __name__ == "__main__":
    # Parse command-line arguments
    if len(sys.argv) < 3:
        print("Usage: python script.py <ip> <username> <password> <command1> <command2> ...")
        sys.exit(1)

    ip = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3] if len(sys.argv) > 3 else None
    commands = sys.argv[4:] if len(sys.argv) > 4 else []

    # Run the telnet session
    terminal_entries = telnet_session(ip, username, password, commands)

    # Dump the result in JSON format to stdout
    print(json.dumps(terminal_entries, indent=4))
