import { TerminalEntry } from "@/store/terminalStore";
import { Client } from "ssh2";

// This is the SSH execution method we use for all devices that are not cisco
// This is much simpler than the cisco method, doesn't require parsing anything, because the returned output is constructed as the execution happens

// Function to execute a list of commands and return the result as TerminalEntry[]
const executeCommands = (conn: Client, commands: string[]): Promise<TerminalEntry[]> => {
    return new Promise((resolve, reject) => {
        let results: TerminalEntry[] = []; // Array to store results for all commands
        let currentCommandIndex = 0;

        // Helper function to execute each command sequentially
        const executeNextCommand = () => {
            if (currentCommandIndex < commands.length) {
                const command = commands[currentCommandIndex];
                conn.exec(command, (err, stream) => {
                    if (err) {
                        results.push({ type: 'error', content: `Error executing "${command}": ${err.message}` });
                        currentCommandIndex++;
                        executeNextCommand(); // Move to the next command
                        return;
                    }

                    let result = '';
                    let error = '';
                    setTimeout(() => {
                        conn.end();
                    }, 10000);

                    stream
                        .on('data', (data: Buffer) => {
                            result += data.toString(); // Accumulate stdout output
                        })
                        .on('close', () => {
                            const entries: TerminalEntry[] = [
                                { type: 'command', content: command } // Add the executed command as an entry
                            ];

                            if (error) {
                                entries.push({ type: 'error', content: error.trim() });
                            } else {
                                entries.push({ type: 'output', content: result.trim() });
                            }

                            results = results.concat(entries); // Append the result of this command
                            currentCommandIndex++;
                            executeNextCommand(); // Move to the next command
                        })
                        .stderr.on('data', (data: Buffer) => {
                            error += data.toString(); // Accumulate stderr output
                        });
                });
            } else {
                // All commands have been executed, resolve the promise with the results
                resolve(results);
            }
        };

        // Start executing the commands
        executeNextCommand();
    });
};

export default executeCommands;
