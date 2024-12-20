import { TerminalEntry } from '@/store/terminalStore';
import { NextResponse } from 'next/server';
import { Device } from '@/classes/Device';
import handleExecution from './execHandler';


export interface RequestData {
    hostname: string;
    username: string;
    password: string;
    commands?: string[];

    devicetype?: Device["type"]
    enablepass?: string;

    settings?: CallSettings
}

export interface CallSettings {
    forceciscossh: boolean
    usecompiledbinaries: boolean
}

// ======================================================= //
//                                                         //
// -------------------- START OF CODE -------------------- //
//                                                         //
// ======================================================= //

export async function POST(request: Request) {
    try {
        const { hostname, username, password, commands: rawCommands, devicetype, enablepass, settings }: RequestData = await request.json();

        // Validate required fields
        if (!hostname || !username || !password) {
            return NextResponse.json([{ type: 'error', content: `Missing required fields: hostname, username, password` }], { status: 400 });
        }

        let commands: string[] = [];

        // If commands are provided in the correct format parse them. Otherwise throw an error.
        if (rawCommands) {
            if (Array.isArray(rawCommands)) {
                // Filter out empty strings from the command list
                commands = rawCommands.filter((cmd: string) => cmd.trim() !== '');
            } else {
                // Respond with an error
                return NextResponse.json([{ type: 'error', content: `Commands in request should be in the form of an array` }], { status: 400 });
            }
        }

        /* We no longer test the connection in JS. (The respective python modules are responsible)
        if (((devicetype === 'cisco_switch') || (devicetype === 'cisco_router') || (devicetype === 'cisco_firewall')) && settings?.forceciscossh) {

        }
        else if (commands.length === 0) {
            const connectionResult = await testConnection(hostname, username, password);
            return NextResponse.json({ output: connectionResult });
        }
        */

        const terminalEntries = await handleExecution(hostname, username, password, commands, devicetype, enablepass, settings);
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


// Function to test SSH connection without running any commands
// This will remain in place, though all execution logic will move to python
/*
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
                reject([{ type: 'error', content: `Connection Error: ${err.message}` }]); // Return an error message
            });
    });
};
 */

/* Unused, we are now using python execution instead
// Modify the HandleSSH function to use the new executeCommandsViaShell
async function HandleSSH(hostname: string, username: string, password: string, commands: string[], devicetype?: Device["type"], enablepass?: string): Promise<TerminalEntry[]> {
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
*/