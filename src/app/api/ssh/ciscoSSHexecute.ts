import { TerminalEntry } from "@/store/terminalStore";
import { Client } from "ssh2";


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

export default executeCommandsViaShell