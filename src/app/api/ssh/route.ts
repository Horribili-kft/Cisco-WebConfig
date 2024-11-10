import { NextResponse } from 'next/server';
import { Client } from 'ssh2';

// Function to execute a single command
const executeCommand = (conn: Client, command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) {
                return reject(`Error executing "${command}": ${err.message}`);
            }

            let result = '';
            let error = '';

            stream
                .on('data', (data: Buffer) => {
                    result += data.toString(); // Accumulate stdout output
                })
                .on('close', () => {
                    if (error) {
                        return reject(`Error executing command "${command}": ${error}`);
                    }
                    resolve(result.trim()); // Resolve with the command output
                })
                .stderr.on('data', (data: Buffer) => {
                    error += data.toString(); // Accumulate stderr output
                });
        });
    });
};

// Utility function to establish SSH connection and run commands
async function HandleSSH(hostname: string, username: string, password: string, commands: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let output = '';

        conn.connect({
            host: hostname,
            // In the future we could add a port chooser.
            port: 22, // Default SSH port
            username: username,
            password: password,
        })
            .on('ready', async () => {
                // If no commands are to be run but the connection was successful, notify the user.
                if (commands.length === 0 || (commands.length === 1 && commands[0].trim() === "")) {
                    conn.end();
                    resolve('SSH connection established successfully, no commands to run.');
                }

                else {
                    try {
                        for (const command of commands) {
                            console.log(`Executing command: ${command}`);
                            output += await executeCommand(conn, command) + '\n'; // Accumulate all command outputs
                        }
                        conn.end();
                        resolve(output.trim()); // Resolve with all command outputs
                    } catch (error) {
                        conn.end(); // Ensure the connection is closed in case of error
                        reject(error); // Reject if any command fails
                    }
                }
            })
            .on('error', (err) => {
                reject(`SSH Connection Error: ${err.message}`);
            })

    });
}

export async function POST(request: Request) {
    try {
        // Destructure json for future use
        const { hostname, username, password, command: rawCommand } = await request.json();

        // Validate required fields
        if (!hostname || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields: hostname, username, password.' }, { status: 400 });
        }

        console.log(hostname, username, password);
        console.log(rawCommand);

        let commands: string[] = [];

        // Check if rawCommand is provided and validate that it's a string.
        if (rawCommand) {
            if (typeof rawCommand === 'string') {
                // If it's a string, split by newlines (with or without carriage return) or semicolon
                commands = rawCommand.split(/\r?\n|;/).filter((cmd: string) => cmd.trim() !== '');
            } else {
                return NextResponse.json({
                    error: 'Invalid input: "command" should be a string.'
                }, { status: 400 });
            }
        } else {
            // If no command is provided, you can either set a default or handle this scenario
            // For example, if it's okay not to provide a command:
            commands = []; // No commands to run, just return empty output or test connection behavior
        }

        // Pass destructured output to the SSH handler
        const output = await HandleSSH(hostname, username, password, commands);

        // Return the output of the commands if successful, otherwise an error is thrown
        return NextResponse.json({ output });

    } catch (error: unknown) {
        console.log(error);
        return NextResponse.json({ error: error instanceof Error ? error.message : error || 'An error occurred' }, { status: 500 });
    }
}
