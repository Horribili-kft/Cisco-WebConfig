// app/api/ssh/route.ts
import { NextResponse } from 'next/server';
import { Client } from 'ssh2';

// Function to execute a single command
const executeCommand = (conn: Client, command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) {
                return reject(`Error executing command "${command}": ${err.message}`);
            }

            let result = '';

            stream
                .on('data', (data: any) => {
                    result += data.toString(); // Accumulate output
                })
                .on('close', () => {
                    resolve(result.trim()); // Resolve with the command output
                })
                .stderr.on('data', (data) => {
                    resolve(`Error executing command "${command}": ${data.toString()}`); // Resolve with error message
                });
        });
    });
};

// Utility function to establish SSH connection and run commands
async function runSSHCommands(hostname: string, username: string, password: string, commands: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const results: string[] = []; // Array to hold output of each command

        conn
            .on('ready', async () => {
                if (commands.length === 0) {
                    conn.end();
                    resolve(['SSH connection established successfully, no commands to run.']);
                } else {
                    try {
                        for (const command of commands) {
                            const output = await executeCommand(conn, command);
                            results.push(output); // Store the output of each command
                        }
                        conn.end();
                        resolve(results); // Resolve with all command outputs
                    } catch (error) {
                        reject(error); // Reject if any command fails
                    }
                }
            })
            .on('error', (err) => {
                reject(`SSH Connection Error: ${err.message}`);
            })
            .connect({
                host: hostname,
                port: 22, // Default SSH port
                username: username,
                password: password,
            });
    });
}

// Handle the POST request
export async function POST(request: Request) {
    try {
        const { hostname, username, password, commands } = await request.json();

        // Validate required fields
        if (!hostname || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields: hostname, username, password.' }, { status: 400 });
        }

        // Run SSH commands
        const output = await runSSHCommands(hostname, username, password, commands);
        return NextResponse.json({ output });
    } catch (error: any) {
        console.log(error);
        if (error.message && error.message.startsWith("getaddrinfo ENOTFOUND")) {
            return NextResponse.json({ error: `Hostname could not be resolved` }, { status: 500 });
        }
        return NextResponse.json({ error: error.message || error ||'An error occurred' }, { status: 500 });
    }
}
