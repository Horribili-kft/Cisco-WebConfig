import { TerminalEntry } from "@/store/terminalStore";
import { Device } from "./Device";
import { apicall } from "@/helpers/apicall";

interface LinuxInterface {
    name: string;
    up: boolean;
    ipAddress?: string;
    macAddress?: string;
}

export default class LinuxDevice implements Device {
    hostname: string;
    type: 'linux';
    version: string;
    interfaces: LinuxInterface[];

    constructor(hostname: string = '', version: string = '') {
        this.hostname = hostname;
        this.type = 'linux';
        this.version = version;
        this.interfaces = [];
    }

    // Unified method to handle the parsing of configuration data
    private parseConfigData({ hostname, version, interfacesRaw }: { hostname: string; version: string; interfacesRaw: string }): void {
        const interfaces: LinuxInterface[] = [];
        const lines = interfacesRaw.split('\n');
        let currentInterface: Partial<LinuxInterface> = {};

        lines.forEach((line) => {
            // Match interface line: "2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500..."
            const ifaceMatch = line.match(/^(\d+): (\w+): <(.*)> mtu/);
            if (ifaceMatch) {
                if (currentInterface.name) interfaces.push(currentInterface as LinuxInterface);
                currentInterface = {
                    name: ifaceMatch[2],
                    up: ifaceMatch[3].includes('UP'),
                };
            }

            // Match IP address line: "inet 10.0.22.7/24 brd 10.0.22.255 scope global dynamic enp0s3"
            const ipMatch = line.match(/\s+inet (\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) currentInterface.ipAddress = ipMatch[1];

            // Match MAC address line: "link/ether 08:00:27:0a:35:d7 brd ff:ff:ff:ff:ff:ff"
            const macMatch = line.match(/\s+link\/ether ([\w:]+)/);
            if (macMatch) currentInterface.macAddress = macMatch[1];
        });

        // Add the last interface if it exists
        if (currentInterface.name) interfaces.push(currentInterface as LinuxInterface);

        // Update the device properties
        this.hostname = hostname;
        this.version = version;
        this.interfaces = interfaces;
    }

    // This method now expects the config as a JSON object directly
    parseConfig(config: { output: TerminalEntry[] }): void {
        let hostnameOutput: string | undefined;
        let versionOutput: string | undefined;
        let interfacesRaw: string | undefined;

        // Traverse the terminal entries to extract command outputs
        for (let i = 0; i < config.output.length; i++) {
            const entry = config.output[i];
            const command = entry.type === 'command' ? entry.content.trim() : '';
            const outputContent = config.output[i + 1]?.type === 'output' ? config.output[i + 1].content.trim() : '';

            if (command && outputContent) {
                switch (command) {
                    case 'hostname':
                        hostnameOutput = outputContent;
                        break;
                    case 'uname -r':
                        versionOutput = outputContent;
                        break;
                    case 'ip a':
                        interfacesRaw = outputContent;
                        break;
                }
            }
        }

        // Ensure we have all the necessary outputs before calling parseConfigData
        if (hostnameOutput && versionOutput && interfacesRaw) {
            this.parseConfigData({ hostname: hostnameOutput, version: versionOutput, interfacesRaw });
        } else {
            throw new Error('Failed to parse system config. Ensure the response contains the correct outputs.');
        }
    }

    // Method to fetch system details from a Linux machine via SSH
    async fetchConfig(hostname: string, username: string, password: string): Promise<void> {
        try {
            const response = await apicall({
                hostname,
                username,
                password,
                devicetype: 'linux',
                commands: ['export TERM=dumb', 'hostname', 'uname -r', 'ip a'], // Fetch hostname, kernel version, and interfaces
            });
            if (!response.ok) {
                throw new Error('Failed to fetch system config. Status: ' + response.status);
            }

            const data = await response.json();
            this.parseConfig(data);
        } catch (error) {
            console.error('Error fetching system config:', error);
            throw new Error('Failed to fetch system config.');
        }
    }

    // Method to get details about a specific interface by name
    getInterfaceDetails(interfaceName: string): LinuxInterface | undefined {
        return this.interfaces.find((iface) => iface.name === interfaceName);
    }

    displayConfig(): void {
        console.log(`Hostname: ${this.hostname}`);
        console.log(`Kernel Version: ${this.version}`);
        console.log('Interfaces:');
        this.interfaces.forEach((iface) => {
            console.log(`Interface ${iface.name}, ${iface.up ? "Up" : "Down"}, IP: ${iface.ipAddress || 'N/A'}, MAC: ${iface.macAddress || 'N/A'}`);
        });
    }
}
