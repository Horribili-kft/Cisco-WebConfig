// ======================================================= //
//                                                         //
// ------------------- EXECUTION LOGIC ------------------- //
//                                                         //
// ======================================================= //

import { Device } from "@/classes/Device";
import { TerminalEntry } from "@/store/terminalStore";
import { exec } from "child_process";
import { platform } from "os";
import path from "path";
import fs from 'fs'
import { CallSettings } from "./route";
import HandleCiscoSSH from "./ts (deprecated)/ciscoSSHexecute";

// Mapping for executable names based on the device type
const EXECUTABLE_NAMES = {
    TELNET_CISCO: 'telnet_cisco', // For Cisco devices using Telnet
    SSH_CISCO: 'ssh_cisco', // Experimental SSH for cisco
    SSH_OTHER: 'ssh_linux', // For SSH script used by all other devices
};

// Function to determine the correct executable path based on the current platform (OS)
const getExecutablePath = (baseName: string): string | null => {
    const osPlatform = platform(); // Get the OS platform (e.g., 'win32' or 'linux')
    const distDir = path.join('src', 'app', 'api', 'ssh', 'python', 'dist'); // 'dist' folder containing the compiled executables
    let filePath: string;

    // If the OS is Windows, look for a .exe file; otherwise, look for the file without extension (Linux)
    if (osPlatform === 'win32') {
        filePath = path.join(distDir, `${baseName}.exe`); // Windows: expects .exe extension
    } else if (osPlatform === 'linux') {
        filePath = path.join(distDir, baseName); // Linux: expects no extension
    } else {
        return null; // If the platform is not supported, return null
    }

    // Check if the file exists at the computed path
    return fs.existsSync(filePath) ? filePath : null; // Return the file path if it exists, else null
};

// Function to execute a process (either binary or Python script) and return a promise for TerminalEntry[]
const executeProcess = (
    executable: string,
    args: string[] // Arguments to pass to the executable
): Promise<TerminalEntry[]> => {
    // Construct the full command to run, including executable and arguments
    const command = `${executable} ${args.join(' ')}`;

    console.log(command); // Log the command being executed

    // Return a promise that resolves with the parsed output or rejects with an error
    return new Promise((resolve, reject) => {
        // Execute the command using exec
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject([{ type: 'error', content: `${stderr} ${error}` }]);
                return;
            }
            try {
                // Parse the JSON output from the command
                const parsedOutput: TerminalEntry[] = JSON.parse(stdout);
                resolve(parsedOutput);  // Resolve with the parsed JSON output
            } catch (parseError) {
                reject([{ type: 'error', content: `Error parsing output: ${parseError}` }]); // Handle parsing errors
            }
        });
    });
};

// Main function to handle the execution of the device script or compiled binary
const handleExecution = (
    hostname: string, // Hostname of the device
    username: string, // Username for authentication
    password: string, // Password for authentication
    commands: string[], // List of commands to execute
    devicetype?: Device["type"], // Device type (optional)
    enablepass?: string, // Enable password (optional)
    settings?: CallSettings // Flag to force Cisco SSH (optional)
): Promise<TerminalEntry[]> => {
    return new Promise((resolve, reject) => {
        let filepath: string; // Variable to store the script or executable path
        let executable: string | null = null; // Variable to store the executable path if found

        if (devicetype === 'cisco_switch' || devicetype === 'cisco_firewall' || devicetype === 'cisco_router') {
            // We prepare the command by prepending them with device specific commands
            if (settings?.forceciscossh) {
                console.log('Using experimental CiscoSSH');
                resolve(HandleCiscoSSH(hostname, username, password, commands, enablepass)); // Handle Cisco SSH separately
                return;
            } else {
                filepath = EXECUTABLE_NAMES.TELNET_CISCO; // Default Cisco executable (Telnet)
            }
        } else {
            filepath = EXECUTABLE_NAMES.SSH_OTHER; // Default SSH handler for all other devices
        }

        // Try to find the compiled executable first if the appropriate setting is set
        if (settings?.usecompiledbinaries) {
            executable = getExecutablePath(filepath);
        }

        if (!executable) {
            // If the compiled binary isn't found, fall back to the Python script
            const scriptExtension = '.py'; // Python script extension
            filepath = path.join('src', 'app', 'api', 'ssh', 'python', `${filepath}${scriptExtension}`);
        }

        // Prepare command arguments, wrapping each argument in quotes to handle spaces and special characters
        const commandArgs = [hostname, username, password, ...commands].map(cmd => `"${cmd}"`);

        // If an executable is found, use the compiled binary
        if (executable) {
            console.log(`Using compiled binary: ${executable}`);
            executeProcess(executable, commandArgs)
                .then(resolve)  // Resolve the promise with the output
                .catch(reject); // Reject the promise if there's an error
        } else {
            // If no executable is found, use the Python script instead
            console.log(`Using Python script: ${filepath}`);
            executeProcess('python', ['-u', filepath, ...commandArgs])
                .then(resolve)  // Resolve the promise with the output
                .catch(reject); // Reject the promise if there's an error
        }
    });
};

export default handleExecution