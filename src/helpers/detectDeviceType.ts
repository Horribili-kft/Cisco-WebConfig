import { TerminalEntry } from "@/store/terminalStore";

export default async function detectDeviceType(hostname: string, username: string, password: string, enablepass?: string): Promise<string> {
    try {

        // TEST FOR CISCO
        // Issue a command that is safe across multiple devices
        const response = await fetch('/api/ssh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostname,
                username,
                password,
                devicetype: 'cisco_switch',
                commands: ['terminal length 0' , 'show version'],  // For Cisco devices
                enablepass
            }),
        });

        const data = await response.json();

        // Detect Cisco switch, router, or firewall
        if (data &&  checkForKeywordInOutputs(data, 'cisco')) {
            if (checkForKeywordInOutputs(data, 'switch')) {
                return 'cisco_switch';
            } 
            else if (checkForKeywordInOutputs(data, 'router')) {
                return 'cisco_router';
            } 
            else if (checkForKeywordInOutputs(data, 'ASA') ||  checkForKeywordInOutputs(data, 'security')) {
                return 'cisco_firewall';
            }
        }

        // TEST FOR LINUX
        const linuxResponse = await fetch('/api/ssh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostname,
                username,
                password,
                devicetype: 'linux',
                commands: ['export TERM=dumb', 'uname -a', 'cat /etc/os-release']  // Linux commands
            }),
        });

        const linuxData = await linuxResponse.json();
        const isLinux = checkForKeywordInOutputs(linuxData, 'linux')
        if (isLinux) {
            return 'linux';
        }

        // TEST FOR WINDOWS
        const windowsResponse = await fetch('/api/ssh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostname,
                username,
                password,
                devicetype: 'windows',
                commands: ['ver']  // Windows command
            }),
        });

        const windowsData = await windowsResponse.json();
        const windowsOutput = checkForKeywordInOutputs(windowsData, 'windows')

        if (windowsOutput) {
            return 'windows';
        }

        // If none of the above matches, return unknown
        return 'unknown_device';

    } catch (error) {
        console.error('Error detecting device type:', error);
        return 'unknown_device';
    }
}

// Check if a keyword is in any of the terminalentry output fields.
function checkForKeywordInOutputs(
    data: { output: TerminalEntry[] },
    keyword: string
):
    string | null {
    console.log(data)
    console.log(keyword)
    const isKeywordFound = data.output.some(
        (entry) => entry.type === 'output' && entry.content.toLowerCase().includes(keyword.toLowerCase())
    );
    console.log(isKeywordFound)
    return isKeywordFound ? keyword : null;
}
