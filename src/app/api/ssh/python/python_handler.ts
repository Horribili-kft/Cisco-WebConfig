import { exec } from 'child_process';
import { TerminalEntry } from "@/store/terminalStore";
import { Device } from '@/classes/Device';
import HandleCiscoSSH from '../ts (deprecated)/ciscoSSHexecute';

const executePythonScript = (hostname: string, username: string, password: string, commands: string[], devicetype?: Device["type"], enablepass?: string, forceciscossh = false): Promise<TerminalEntry[]> => {
    return new Promise((resolve, reject) => {
        let filepath: string = "src/app/api/ssh/python/"
        if (devicetype === 'cisco_switch' || devicetype === 'cisco_firewall' || devicetype === 'cisco_router') {
            // Use SSH if forced
            if (forceciscossh) {
                // This could be fixed, until then we are using the JS alternative which already works
                // filepath += "ssh_cisco.py"
                console.log("Using experimental CiscoSSH")
                resolve(HandleCiscoSSH(hostname, username, password, commands, enablepass))
                return
            }
            // Use telnet by default
            else {
                filepath += "telnet_cisco.py"
            }
        }
        else {
            // Change this to cisco once it is ready.
            filepath += "ssh_linux.py"
        }

        const commandString = commands.map(cmd => `"${cmd}"`).join(" ");

        // python ssh_linux ip username password "command 1" "command 2" ...
        const pythonCommand = `python -u ${filepath} ${hostname} ${username} ${password} ${commandString}`;
        console.log(pythonCommand)

        // Execute the Python script
        // As of now the script execution takes a long time because of the overhead of starting up the
        // python interpreter for each run (takes an obscenely long time compared to the runtime of the script)
        // We could use pyinstaller to compile it to machine code, I tested it and it works, and it's fast.
        exec(pythonCommand, (error, stdout, stderr) => {
            if (error) {
                reject([{ type: 'error', content: `Execution error: ${stderr || error.message}` }]);
                return;
            }
            try {
                // Parse the JSON output from Python
                const parsedOutput: TerminalEntry[] = JSON.parse(stdout);
                resolve(parsedOutput);  // Resolve with the parsed JSON output
            } catch (parseError) {
                reject(parseError as TerminalEntry[]);
            }
        });
    });
};

export default executePythonScript;