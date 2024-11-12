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
                commands: ['show version'],  // For Cisco devices
                enablepass
            }),
        });

        const data = await response.json();
        const output = data.output.find((entry: TerminalEntry) => entry.type === 'output')?.content;

        // Detect Cisco switch, router, or firewall
        if (output) {
            if (output.includes('Switch') || output.includes('switch')) {
                return 'cisco_switch';
            } else if (output.includes('Router') || output.includes('router')) {
                return 'cisco_router';
            } else if (output.includes('Adaptive Security Appliance') || output.includes('ASA')) {
                return 'cisco_firewall';
            }
        }

        // If not a Cisco device, try detecting Linux or Windows
        const linuxResponse = await fetch('/api/ssh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostname,
                username,
                password,
                commands: ['uname -a', 'cat /etc/os-release']  // Linux commands
            }),
        });

        const linuxData = await linuxResponse.json();
        const linuxOutput = linuxData.output.find((entry: TerminalEntry) => entry.type === 'output')?.content;

        if (linuxOutput && linuxOutput.includes('Linux')) {
            return 'linux';
        }

        const windowsResponse = await fetch('/api/ssh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostname,
                username,
                password,
                commands: ['ver']  // Windows command
            }),
        });

        const windowsData = await windowsResponse.json();
        const windowsOutput = windowsData.output.find((entry: TerminalEntry) => entry.type === 'output')?.content;

        if (windowsOutput && windowsOutput.includes('Windows')) {
            return 'windows';
        }

        // If none of the above matches, return unknown
        return 'unknown_device';

    } catch (error) {
        console.error('Error detecting device type:', error);
        return 'unknown_device';
    }
}
