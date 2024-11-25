import { TerminalEntry } from "@/store/terminalStore";
import { apicall } from "./apicall";

export default async function detectDeviceType(hostname: string, username: string, password: string, enablepass?: string): Promise<string> {
    try {

        // TEST FOR CISCO
        // Issue a command that is safe across multiple devices
        const ciscoResponse = await apicall({
            hostname,
            username,
            password,
            devicetype: 'cisco_switch',
            commands: ['terminal length 0', 'show version'],  // For Cisco devices
            enablepass
        });
        const ciscoData = await ciscoResponse.json();

        // Detect Cisco switch, router, or firewall
        if (ciscoData && checkForKeywordInOutputs(ciscoData, 'cisco')) {
            if (checkForKeywordInOutputs(ciscoData, 'switch')) {
                return 'cisco_switch';
            }
            else if (checkForKeywordInOutputs(ciscoData, 'router')) {
                return 'cisco_router';
            }
            else if (checkForKeywordInOutputs(ciscoData, 'ASA') || checkForKeywordInOutputs(ciscoData, 'security')) {
                return 'cisco_firewall';
            }
            else { // It was found in testin that at lest one cisco router did not have the 'router' string in its 'show version' output. We now assume that all such cisco devices are routers.
                return 'cisco_router'
            }
        }

        // TEST FOR LINUX
        const linuxResponse = await apicall({
            hostname,
            username,
            password,
            devicetype: 'linux',
            commands: ['export TERM=dumb', 'uname -a', 'cat /etc/os-release']  // Linux commands
        });

        const linuxData = await linuxResponse.json();
        const isLinux = checkForKeywordInOutputs(linuxData, 'linux')
        if (isLinux) {
            return 'linux';
        }

        // TEST FOR WINDOWS
        const windowsResponse = await apicall({
            hostname,
            username,
            password,
            devicetype: 'windows',
            commands: ['ver']  // Windows command
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
function checkForKeywordInOutputs(data: { output: TerminalEntry[] }, keyword: string): string | null {
    const isKeywordFound = data.output.some(
        (entry) => entry.type === 'output' && entry.content.toLowerCase().includes(keyword.toLowerCase())
    );
    return isKeywordFound ? keyword : null;
}
