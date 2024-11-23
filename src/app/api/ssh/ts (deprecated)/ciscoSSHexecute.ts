import { TerminalEntry } from "@/store/terminalStore";
import { Algorithms, Client } from "ssh2";


const ciscoSSHalgorithms: Algorithms = {
    kex: [
        "diffie-hellman-group1-sha1",
        "ecdh-sha2-nistp256",
        "ecdh-sha2-nistp384",
        "ecdh-sha2-nistp521",
        "diffie-hellman-group-exchange-sha256",
        "diffie-hellman-group14-sha1"
    ],
    cipher: [
        "3des-cbc",
        "aes128-ctr",
        "aes192-ctr",
        "aes256-ctr",
        "aes128-gcm",
        "aes128-gcm@openssh.com",
        "aes256-gcm",
        "aes256-gcm@openssh.com"
    ],
    serverHostKey: [
        "ssh-rsa",
        "ecdsa-sha2-nistp256",
        "ecdsa-sha2-nistp384",
        "ecdsa-sha2-nistp521"
    ],
    hmac: [
        "hmac-sha2-256",
        "hmac-sha2-512",
        "hmac-sha1"
    ]
}


// Turns the raw output into output that we can read.


// Cisco requires a non-standard way of executing things (or more standard depending on your view)
// The issue in short is that Cisco devices disconnect when using the SSH built in exec method after execution of the first command.
// This prevents us from configuring pretty much anything, because entering the configure terminal is a single command, and there goes our connection.
// Debugging this took way, way, way too long.

// Otherwise, this method is worse by every metric, do not use this unless you have to. Us the other, more standard exec method.

// !!! IMPORTANT !!! This requires that the SSH server actually returns in some capacity the commands we executed. It uses those as markers to break up the blob of output we get back at the end of executing everything.
// This is 100% the case for cisco (tested). Linux doesn't do this in all cases, so we use the other exec for that.
const processRawOutput = (rawOutput: string, commands: string[]): TerminalEntry[] => {
    const terminalEntries: TerminalEntry[] = [];

    // Loop through all the commands and extract their outputs
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];

        // Find the position of the command in the raw output
        const commandIndex = rawOutput.indexOf(command);
        if (commandIndex === -1) {
            continue; // If command is not found, skip it (can happen for commands not executed)
        }

        // Find the next command in the raw output (to mark the end of the current output)
        const nextCommandIndex = i + 1 < commands.length ? rawOutput.indexOf(commands[i + 1], commandIndex) : -1;

        // Extract the output between the current command and the next command
        const output = nextCommandIndex !== -1
            ? rawOutput.slice(commandIndex + command.length, nextCommandIndex).trim()
            : rawOutput.slice(commandIndex + command.length).trim();  // Handle last command output

        // Add the command entry
        terminalEntries.push({ type: 'command', content: command });

        // Add the output entry
        if (output) {
            terminalEntries.push({ type: 'output', content: output });
        }

        // Remove the processed command and its output from rawOutput to avoid duplication
        rawOutput = rawOutput.slice(0, commandIndex) + rawOutput.slice(commandIndex + command.length + output.length);
    }

    return terminalEntries;
};


async function HandleCiscoSSH(hostname: string, username: string, password: string, commands: string[], enablepass?: string): Promise<TerminalEntry[]> {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let terminalEntries: TerminalEntry[] = [];
        console.log(enablepass)
        conn.connect({
            host: hostname,
            port: 22, // Default SSH port
            username: username,
            password: password,
            algorithms: ciscoSSHalgorithms
        })
            .on('ready', async () => {
                if (commands.length === 0) {
                    resolve([{ type: 'output', content: `🟢 SSH connection to ${hostname} established successfully` }]);
                } else {
                    try {
                        // We will execute commands with a different method depending on what kind of device we connect to
                        // This is necessary, because at cisco (even with linux based IOS) and linux execution methods are not compatible. Other OSs are not tested yet.
                        const commandResult = await executeCommandsViaShell(conn, commands);

                        terminalEntries = [...terminalEntries, ...commandResult];
                        resolve(terminalEntries);
                    }

                    catch (error) {
                        reject([{ type: 'error', content: `Execution error: ${error instanceof Error ? error.message : error}` }]);
                    } finally {
                        conn.end(); // Close the connection after all commands are processed
                    }
                }
            })
            .on('error', (err) => {
                reject([{ type: 'error', content: `SSH Connection Error: ${err.message}` }]);
            });
    });
}

const executeCommandsViaShell = (conn: Client, commands: string[]): Promise<TerminalEntry[]> => {
    return new Promise((resolve, reject) => {
        let result = ''; // To hold the complete output (raw)
        let error = ''; // To capture any error output

        conn.shell((err, stream) => {
            if (err) return reject([{ type: 'error', content: `Shell error: ${err.message}` }]);

            // Stream events to handle command execution
            stream.on('data', (data: Buffer) => {
                result += data.toString(); // Collect output
            }).on('close', () => {
                // Process the raw output after stream is closed
                const terminalEntries = processRawOutput(result, commands);

                // If there were any errors, we can add them at the end
                if (error) {
                    terminalEntries.push({ type: 'error', content: error.trim() });
                }

                resolve(terminalEntries); // Return the structured entries
            }).stderr.on('data', (data: Buffer) => {
                error += data.toString(); // Collect errors
            });

            // Write commands to the shell
            commands.forEach((command) => {
                stream.write(`${command}\n`);
            });

            // Close the stream after sending commands
            stream.end('exit\n');
        });
    });
};

export default HandleCiscoSSH