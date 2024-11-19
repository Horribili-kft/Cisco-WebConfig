import { TerminalEntry } from "@/store/terminalStore";
import { Device } from "./Device";
import { apicall } from "@/helpers/apicall";

interface SwitchInterface {
    name: string;
    shortname: string;
    switchportMode: string;
    vlan: number;
    shutdown: boolean;
}

interface VlanConfig {
    id: number;
    name: string;
}

export default class Switch implements Device {
    hostname: string;
    type: 'cisco_switch'; // 'switch'
    version: string;
    interfaces: SwitchInterface[];
    vlans: VlanConfig[];

    constructor(hostname: string = '', version: string = '') {
        this.hostname = hostname;
        this.type = 'cisco_switch';
        this.version = version;
        this.interfaces = [];
        this.vlans = [];
    }

    // Method to initialize the switch with running config output
    parseConfig(runningConfig: string): void {
        const parsedConfig = parseRunningConfig(runningConfig);

        this.hostname = parsedConfig.hostname;
        this.version = parsedConfig.version;
        this.interfaces = parsedConfig.interfaces;
        this.vlans = parsedConfig.vlans;
    }

    // Method to get the running-config by using the API to execute a command on the server. Requires enable privileges.
    async fetchConfig(hostname: string, username: string, password: string, enablepass?: string): Promise<void> {
        try {
            const response = await apicall({
                hostname,
                username,
                password,
                commands: ['terminal length 0', 'show running-config'],
                devicetype: 'cisco_switch',
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
    getInterfaceDetails(interfaceName: string): SwitchInterface | undefined {
        return this.interfaces.find((iface) => iface.name === interfaceName);
    }

    // Method to display a summary of the switch configuration. Will probably go unused
    displayConfig(): void {
        console.log(`Switch Hostname: ${this.hostname}`);
        console.log(`Switch Version: ${this.version}`);
        console.log('Interfaces:');
        this.interfaces.forEach((iface) => {
            console.log(`  - Interface ${iface.name} (Shortname: ${iface.shortname}): Switchport Mode ${iface.switchportMode}, VLAN ${iface.vlan}, Shutdown ${iface.shutdown ? 'Yes' : 'No'}`);
        });
        console.log('VLANs:');
        this.vlans.forEach((vlan) => {
            console.log(`  - VLAN ${vlan.id}: ${vlan.name}`);
        });
    }
}

// We generate short names for interfaces. Good for UI, but not much else
function generateShortName(fullName: string): string {
    if (fullName.startsWith('GigabitEthernet')) {
        return fullName.replace('GigabitEthernet', 'Gig');
    } else if (fullName.startsWith('FastEthernet')) {
        return fullName.replace('FastEthernet', 'Fa');
    } else if (fullName.startsWith('Ethernet')) {
        return fullName.replace('Ethernet', 'Eth');
    } else if (fullName.startsWith('Loopback')) {
        return fullName.replace('Loopback', 'lo');
    } else {
        return fullName;
    }
}

// Function to parse the running config to extract useful information
export function parseRunningConfig(config: string): { hostname: string; version: string; interfaces: SwitchInterface[]; vlans: VlanConfig[] } {
    const configLines = config.split('\n');

    const interfaces: SwitchInterface[] = [];
    const vlans: VlanConfig[] = [];
    let hostname = '';
    let version = '';

    let currentInterface: SwitchInterface | null = null;

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
                shortname: generateShortName(interfaceName), // Set the shortname
                switchportMode: '',
                vlan: 1, // Default VLAN is usually 1
                shutdown: false,
            };
        }

        if (currentInterface) {
            // Extract switchport mode
            if (line.includes('switchport mode')) {
                const modeMatch = line.match(/switchport mode (\S+)/);
                if (modeMatch) {
                    currentInterface.switchportMode = modeMatch[1];
                }
            }

            // Extract VLAN
            if (line.includes('switchport access vlan')) {
                const vlanMatch = line.match(/switchport access vlan (\d+)/);
                if (vlanMatch) {
                    currentInterface.vlan = parseInt(vlanMatch[1], 10);
                }
            }

            // Check for shutdown status
            if (line.includes('shutdown')) {
                currentInterface.shutdown = true;
            }
        }

        // Parse VLANs
        const vlanMatch = line.match(/^vlan (\d+)/);
        if (vlanMatch) {
            const vlanId = parseInt(vlanMatch[1], 10);
            let vlanName = '';
            const nextLine = configLines[configLines.indexOf(line) + 1];
            if (nextLine && nextLine.trim().startsWith('name ')) {
                vlanName = nextLine.replace('name ', '').trim();
            }
            vlans.push({ id: vlanId, name: vlanName });
        }
    });

    // Push the last interface if any
    if (currentInterface) {
        interfaces.push(currentInterface);
    }

    return { hostname, version, interfaces, vlans };
}
