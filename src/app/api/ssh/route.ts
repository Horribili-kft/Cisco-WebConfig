import { TerminalEntry } from '@/store/terminalStore';
import { NextResponse } from 'next/server';
import { Client } from 'ssh2';


// Function to execute a single command and return the result as TerminalEntry[]
const executeCommand = (conn: Client, command: string): Promise<TerminalEntry[]> => {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) {
                return reject([{ type: 'error', content: `Error executing "${command}": ${err.message}` }]);
            }

            let result = '';
            let error = '';

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

                    resolve(entries); // Resolve with the command and output/error entries
                })
                .stderr.on('data', (data: Buffer) => {
                    error += data.toString(); // Accumulate stderr output
                });
        });
    });
};

// Function to test SSH connection without running any commands
const testConnection = (hostname: string, username: string, password: string): Promise<TerminalEntry[]> => {
    return new Promise((resolve, reject) => {
        const conn = new Client();

        conn.connect({
            host: hostname,
            port: 22, // Default SSH port
            username: username,
            password: password,
        })
            .on('ready', () => {
                conn.end(); // Close the connection once we know it's successful
                resolve([{ type: 'output', content: `🟢 Successfully connected to ${hostname}` }]); // Return a success message
            })
            .on('error', (err) => {
                reject([{ type: 'error', content: `SSH Connection Error: ${err.message}` }]); // Return an error message
            });
    });
};

// Utility function to establish SSH connection and run commands
async function HandleSSH(hostname: string, username: string, password: string, commands: string[], enablepass?: string): Promise<TerminalEntry[]> {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let terminalEntries: TerminalEntry[] = [];

        conn.connect({
            host: hostname,
            port: 22, // Default SSH port
            username: username,
            password: password,
        })
            .on('ready', async () => {
                if (commands.length === 0) {
                    // If no commands are given, test connection and resolve
                    conn.end();
                    resolve([{ type: 'output', content: `🟢 SSH connection to ${hostname} established successfully` }]);
                } else {
                    try {
                        // If we get an enable password, we enter enable mode. This can't be done in another way
                        // because we can't pass data back and forth arbitrarily, we can only do so only once per request.
                        if (enablepass) {
                            console.log("Entering enable mode...")
                            const result = await executeCommand(conn, `enable${enablepass}\n`)
                            terminalEntries = [...terminalEntries, ...result]
                        }

                        for (const command of commands) {
                            const commandResult = await executeCommand(conn, command);
                            terminalEntries = [...terminalEntries, ...commandResult]; // Accumulate terminal entries
                        }
                        conn.end();
                        resolve(terminalEntries); // Resolve with all accumulated terminal entries
                    } catch (error) {
                        conn.end();
                        reject([{ type: 'error', content: `Execution error: ${error instanceof Error ? error.message : error}` }]);
                    }
                }
            })
            .on('error', (err) => {
                reject([{ type: 'error', content: `SSH Connection Error: ${err.message}` }]);
            });
    });
}

export async function POST(request: Request) {
    interface RequestData {
        hostname: string;
        username: string;
        password: string;
        commands?: string | string[];
        enablepass?: string;
    }

    try {

        const { hostname, username, password, commands: rawCommands, enablepass }: RequestData = await request.json();

        // Validate required fields
        if (!hostname || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields: hostname, username, password.' }, { status: 400 });
        }

        let commands: string[] = [];

        // If commands are provided, parse them. Otherwise, treat as an empty array.
        if (rawCommands) {
            if (typeof rawCommands === 'string') {
                commands = rawCommands.split(/\r?\n|;/).filter((cmd: string) => cmd.trim() !== '');
            } else if (Array.isArray(rawCommands)) {
                commands = rawCommands.filter((cmd: string) => cmd.trim() !== '');
            } else {
                return NextResponse.json({ error: 'Invalid input: "commands" should be a string or an array.' }, { status: 400 });
            }
        }
        console.log(enablepass)

        // If no commands are given, test the SSH connection
        if (commands.length === 0) {
            const connectionResult = await testConnection(hostname, username, password);
            return NextResponse.json({ output: connectionResult });
        }

        // Otherwise, handle the SSH commands execution
        const terminalEntries = await HandleSSH(hostname, username, password, commands, enablepass);
        return NextResponse.json({ output: terminalEntries });

    }
    // Error handling
    catch (error: any) {
        console.error(error);

        // Check if the error is already in the TerminalEntry[] format
        if (Array.isArray(error) && error.every((entry) => entry.type && entry.content)) {
            // If error is in TerminalEntry[] format, return it as the output
            return NextResponse.json({ output: error }, { status: 200 });
        }

        // Otherwise, return a generic 'unknown error' as a TerminalEntry
        const unknownErrorEntry: TerminalEntry[] = [{ type: 'error', content: 'Unknown error occurred' }];
        return NextResponse.json({ output: unknownErrorEntry }, { status: 200 });
    }
}