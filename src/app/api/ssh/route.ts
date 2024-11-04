import { NextResponse } from 'next/server';
import { Client, ConnectConfig } from 'ssh2';

interface SSHResponse {
    output?: string;
    error?: string;
}

// We accept commands as well
async function sshConnect(hostname: string, username: string, password: string, commands?: string[]): Promise<SSHResponse> {
    const sshClient = new Client();
    return new Promise<SSHResponse>((resolve, reject) => {
        sshClient.on('ready', async () => {
            try {
                let output = '';

                // If commands are provided, execute them
                if (commands && commands.length > 0) {
                    output = await executeCommands(sshClient, commands);
                } else {
                    output = 'Connected successfully. No commands executed.';
                }

                resolve({ output });
            } catch (err) {
                reject(err); // Reject the promise on any execution error
            } finally {
                sshClient.end(); // Close the connection when done
            }
        }).connect({
            host: hostname,
            port: 22,
            username,
            password,
        } as ConnectConfig);

        sshClient.on('error', (err) => {
            reject({ error: `SSH Connection error: ${err.message}` });
        });
    });
}

// Function to execute a list of commands
async function executeCommands(sshClient: Client, commands: string[]): Promise<string> {
    let allOutput = '';

    for (const command of commands) {
        const output = await new Promise<string>((resolve, reject) => {
            sshClient.exec(command, (err, stream) => {
                if (err) {
                    return reject(err);
                }

                let commandOutput = '';
                stream.on('data', (data: Buffer) => {
                    commandOutput += data.toString();
                });
                stream.on('close', () => {
                    resolve(commandOutput);
                });
                stream.stderr.on('data', (data: Buffer) => reject(data.toString()));
            });
        });
        allOutput += `\nOutput of command "${command}":\n${output}`;
    }

    return allOutput;
}

// API Route for SSH connection
export async function POST(req: Request) {
    try {
        const body = await req.json(); // Get JSON body
        const { hostname, username, password, commands } = body; // Destructure the body

        // Validate input
        if (!hostname || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Call the sshConnect function
        const response = await sshConnect(hostname, username, password, commands);
        return NextResponse.json(response);
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
