// app/api/ssh/route.ts
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

            stream
                // I don't know the return type of data, so I just define that it can be converted into a string, which is true, since it is a reply from the SSH server
                .on('data', (data: { toString: () => string; }) => {
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
async function HandleSSH(hostname: string, username: string, password: string, commands: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const results: string[] = []; // Array to hold output of each command

        conn
            .on('ready', async () => {
                if (commands.length === 0 || (commands[0].trim() === "" && commands.length === 1)) {
                    conn.end();
                    resolve(['SSH connection established successfully, no commands to run.']);
                } else {
                    try {
                        for (const command of commands) {
                            console.log(`Executing command: ${command}`)
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
        // Destructure json for future use
        const { hostname, username, password, commands } = await request.json();

        // Validate required fields
        if (!hostname || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields: hostname, username, password.' }, { status: 400 });
        }

        // Pass destructured output to the SSH handler
        const output = await HandleSSH(hostname, username, password, commands);

        // Return the output of the commands if are successful, otherwise an error is thrown
        return NextResponse.json({ output });
    } 
    
    // If any error occurs during connection, it gets thrown here
    catch (error: unknown) {
        // (A lot of type safety here that I could not write, nor could I understand. Thank you Llama 3.1 70B)
        console.log(error);
        if (error instanceof Error && error.message.includes("getaddrinfo ENOTFOUND")) {
            return NextResponse.json({ error: `Hostname could not be resolved (${error.message})` }, { status: 500 });
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'An error occurred' }, { status: 500 });
    }
}
