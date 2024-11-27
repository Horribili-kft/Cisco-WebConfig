import { TerminalEntry } from "@/store/terminalStore";
import { Device } from "./Device";
import { apicall } from "@/helpers/apicall";

export interface RouterInterface {
    name: string;
    shortname: string; // Add shortname for router interfaces
    ipAddress: string;
    subnetMask: string;
    shutdown: boolean;
}

interface RoutingProtocolConfig {
    protocol: string;
    network: string;
    mask: string;
}

export default class CiscoRouter implements Device {
    hostname: string;
    type: 'cisco_router'; // 'router'
    version: string;
    interfaces: RouterInterface[];
    routingProtocols: RoutingProtocolConfig[];

    constructor(hostname: string = '', version: string = '') {
        this.hostname = hostname;
        this.type = 'cisco_router';
        this.version = version;
        this.interfaces = [];
        this.routingProtocols = [];
    }

    // Method to initialize the router with running config output
    parseConfig(runningConfig: string): void {
        const parsedConfig = parseRunningConfig(runningConfig);

        this.hostname = parsedConfig.hostname;
        this.version = parsedConfig.version;
        this.interfaces = parsedConfig.interfaces;
        this.routingProtocols = parsedConfig.routingProtocols;
    }

    // Method to get the running-config by using the API to execute a command on the server. Requires enable privileges.
    async fetchConfig(hostname: string, username: string, password: string, enablepass?: string): Promise<void> {
        try {
            const response = await apicall({
                hostname,
                username,
                password,
                commands: ['terminal length 0', 'show running-config'],
                devicetype: 'cisco_router',
                enablepass,
            });

            const data = await response.json();
            const runningConfig = data.output
                .filter((entry: TerminalEntry) => entry.type === 'output')  // Filter all entries with type 'output'
                .map((entry: TerminalEntry) => entry.content)  // Extract the 'content' from each entry
                .join('');  // Concatenate all the content values into one string

            if (runningConfig) {
                this.parseConfig(runningConfig);  // Parse the config once fetched
            } else {
                throw new Error('No running config output found in server reply.');
            }
        } catch (error) {
            console.error('Error fetching running config:', error);
            throw new Error('Failed to fetch the running config.');
        }
    }

    // Method to get details about a specific interface by name
    getInterfaceDetails(interfaceName: string): RouterInterface | undefined {
        return this.interfaces.find((iface) => iface.name === interfaceName);
    }

    // Method to display a summary of the router configuration
    displayConfig(): void {
        console.log(`Router Hostname: ${this.hostname}`);
        console.log(`Router Version: ${this.version}`);
        console.log('Interfaces:');
        this.interfaces.forEach((iface) => {
            console.log(`  - Interface ${iface.name} (Shortname: ${iface.shortname}): IP ${iface.ipAddress} / ${iface.subnetMask}, Shutdown ${iface.shutdown ? 'Yes' : 'No'}`);
        });
        console.log('Routing Protocols:');
        this.routingProtocols.forEach((protocol) => {
            console.log(`  - Protocol: ${protocol.protocol}, Network: ${protocol.network}, Subnet Mask: ${protocol.mask}`);
        });
    }
}

// Helper function to generate short names for router interfaces
function generateShortName(fullName: string): string {
    if (fullName.startsWith('GigabitEthernet')) {
        return fullName.replace('GigabitEthernet', 'Gig');
    } else if (fullName.startsWith('FastEthernet')) {
        return fullName.replace('FastEthernet', 'Fa');
    } else if (fullName.startsWith('Ethernet')) {
        return fullName.replace('Ethernet', 'Eth');
    } else if (fullName.startsWith('Loopback')) {
        return fullName.replace('Loopback', 'lo');
    } else if (fullName.startsWith('Serial')) {
        return fullName.replace('Serial', 'Ser');
    } else {
        return fullName;  // In case it's a non-standard interface name
    }
}

// Function to parse the running config to extract useful information for the router
export function parseRunningConfig(config: string): { hostname: string; version: string; interfaces: RouterInterface[]; routingProtocols: RoutingProtocolConfig[] } {
    const configLines = config.split('\n');

    const interfaces: RouterInterface[] = [];
    const routingProtocols: RoutingProtocolConfig[] = [];
    let hostname = '';
    let version = '';

    let currentInterface: RouterInterface | null = null;

    configLines.forEach(line => {
        // Parse hostname
        if (line.startsWith('hostname ')) {
            hostname = line.replace('hostname ', '').trim();
        }

        // Parse version
        if (line.startsWith('version ')) {
            version = line.replace('version ', '').trim();
        }

        // Parse interface configuration
        if (line.startsWith('interface ')) {
            if (currentInterface) {
                interfaces.push(currentInterface);
            }
            const interfaceName = line.replace('interface ', '').trim();
            currentInterface = {
                name: interfaceName,
                shortname: generateShortName(interfaceName), // Generate shortname for the router interface
                ipAddress: '',
                subnetMask: '',
                shutdown: false,
            };

        }

        if (currentInterface) {
            // Extract IP address and subnet mask (typically with 'ip address')
            if (line.includes('ip address')) {
                const ipMatch = line.match(/ip address (\S+) (\S+)/);
                if (ipMatch) {
                    currentInterface.ipAddress = ipMatch[1];
                    currentInterface.subnetMask = ipMatch[2];
                }
            }

            // Check for shutdown status
            if (line.includes('shutdown')) {
                currentInterface.shutdown = true;
            }
        }

        // Parse routing protocol configurations
        if (line.startsWith('router ')) {
            const protocolMatch = line.match(/^router (\S+)/);
            if (protocolMatch) {
                const protocol = protocolMatch[1];
                const networkLine = configLines[configLines.indexOf(line) + 1];
                const maskLine = configLines[configLines.indexOf(line) + 2];
                if (networkLine && maskLine) {
                    const networkMatch = networkLine.match(/network (\S+)/);
                    const maskMatch = maskLine.match(/netmask (\S+)/);
                    if (networkMatch && maskMatch) {
                        routingProtocols.push({
                            protocol,
                            network: networkMatch[1],
                            mask: maskMatch[1],
                        });
                    }
                }
            }
        }
    });

    // Push the last interface if any
    if (currentInterface) {
        interfaces.push(currentInterface);
    }

    return { hostname, version, interfaces, routingProtocols };
}
