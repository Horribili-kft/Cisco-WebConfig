import { Device } from "./Device";

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

    // This method now conforms to the base `Device` interface and expects a string
    parseConfig(config: string): void {
        // Parse the string back into hostname, version, and interfaces
        const parsedData = JSON.parse(config);
        this.hostname = parsedData.hostname;
        this.version = parsedData.version;
        this.interfaces = parsedData.interfaces;
    }

    // Method to fetch system details from a Linux machine via SSH
    async fetchConfig(hostname: string, username: string, password: string): Promise<void> {
        try {
            const response = await fetch('/api/ssh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostname,
                    username,
                    password,
                    commands: ['hostname', 'uname -r', 'ip a'], // Fetch hostname, kernel version, and interfaces
                }),
            });

            const data = await response.json();

            // Extract command outputs
            const hostnameOutput = data.output.find((entry: any) => entry.type === 'command' && entry.content === 'hostname')?.content;
            const versionOutput = data.output.find((entry: any) => entry.type === 'command' && entry.content === 'uname -r')?.content;
            const interfacesOutput = data.output.find((entry: any) => entry.type === 'command' && entry.content === 'ip a')?.content;

            if (hostnameOutput && versionOutput && interfacesOutput) {
                // Parse the interfaces and construct a JSON string as the final running config
                const parsedData = parseRunningConfig({
                    hostname: hostnameOutput.trim(),
                    version: versionOutput.trim(),
                    interfacesRaw: interfacesOutput
                });

                // Convert parsed data into a JSON string format
                const runningConfig = JSON.stringify(parsedData);

                // Call parseConfig with the stringified version of the parsed data
                this.parseConfig(runningConfig); 
            } else {
                throw new Error('Failed to fetch system details from server.');
            }
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

// Function to parse the system output (running config equivalent) into useful information
function parseRunningConfig(data: { hostname: string; version: string; interfacesRaw: string }): { hostname: string; version: string; interfaces: LinuxInterface[] } {
    const { hostname, version, interfacesRaw } = data;
    const interfaces: LinuxInterface[] = [];

    // Split the `ip a` output by lines to process each network interface's details
    const lines = interfacesRaw.split('\n');
    let currentInterface: Partial<LinuxInterface> = {};

    lines.forEach((line) => {
        // Match interface line: "2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500..."
        const ifaceMatch = line.match(/^(\d+): (\w+): <(.*)> mtu/);
        if (ifaceMatch) {
            // If there's a previous interface being tracked, push it before starting a new one
            if (currentInterface.name) {
                interfaces.push(currentInterface as LinuxInterface);
            }
            currentInterface = {
                name: ifaceMatch[2],
                up: ifaceMatch[3].includes('UP'),
            };
        }

        // Match IP address line: "inet 10.0.22.7/24 brd 10.0.22.255 scope global dynamic enp0s3"
        const ipMatch = line.match(/\s+inet (\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch && currentInterface) {
            currentInterface.ipAddress = ipMatch[1];
        }

        // Match MAC address line: "link/ether 08:00:27:0a:35:d7 brd ff:ff:ff:ff:ff:ff"
        const macMatch = line.match(/\s+link\/ether ([\w:]+)/);
        if (macMatch && currentInterface) {
            currentInterface.macAddress = macMatch[1];
        }
    });

    // Add the last interface if it exists
    if (currentInterface.name) {
        interfaces.push(currentInterface as LinuxInterface);
    }

    return {
        hostname,
        version,
        interfaces
    };
}
