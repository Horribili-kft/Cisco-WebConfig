import { TerminalEntry } from '@/store/terminalStore';
import { NextResponse } from 'next/server';
import { Algorithms, Client } from 'ssh2';
import { Device } from '@/classes/Device';
import executeCommandsViaShell from './ciscoSSHexecute';
import executeCommand from './SSHexecute';

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

// Function to test SSH connection without running any commands
const testConnection = (hostname: string, username: string, password: string): Promise<TerminalEntry[]> => {
    return new Promise((resolve, reject) => {
        const conn = new Client();

        conn.connect({
            host: hostname,
            port: 22, // Default SSH port
            username: username,
            password: password,
            algorithms: ciscoSSHalgorithms
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


// Modify the HandleSSH function to use the new executeCommandsViaShell
async function HandleSSH(hostname: string, username: string, password: string, commands: string[], devicetype?: Device["type"], enablepass?: string | undefined): Promise<TerminalEntry[]> {
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
                        let commandResult
                        console.log('Device type:' + devicetype || 'undefined')
                        // If the device is a cisco switch, router, or ASA, we use this method
                        if (devicetype && (devicetype === 'cisco_switch' || devicetype === 'cisco_router' || devicetype === 'cisco_firewall')) {
                            console.log('Executing via shell exec method (cisco compatible)')
                            commandResult = await executeCommandsViaShell(conn, commands);
                        }
                        // In every other case, we use the better method
                        else {
                            console.log('Executing via normal exec method')
                            commandResult = await executeCommand(conn, commands)
                        }

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




export async function POST(request: Request) {
    interface RequestData {
        hostname: string;
        username: string;
        password: string;
        commands?: string | string[];
        devicetype?: Device["type"]
        enablepass?: string;
    }

    try {

        const { hostname, username, password, commands: rawCommands, devicetype, enablepass }: RequestData = await request.json();

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

        // If no commands are given, test the SSH connection
        if (commands.length === 0) {
            const connectionResult = await testConnection(hostname, username, password);
            return NextResponse.json({ output: connectionResult });
        }

        // Otherwise, handle the SSH commands execution
        const terminalEntries = await HandleSSH(hostname, username, password, commands, devicetype, enablepass);
        return NextResponse.json({ output: terminalEntries });

    }
    // Error handling
    catch (error: unknown) {
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