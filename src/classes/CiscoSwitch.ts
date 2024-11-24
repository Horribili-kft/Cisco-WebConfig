import { TerminalEntry } from "@/store/terminalStore";
import { Device } from "./Device";
import { apicall } from "@/helpers/apicall";

interface SwitchInterface {
    id: number;
    name: string;
    shortname: string;
    switchportMode: 'trunk' | 'access';
    vlan: number;
    shutdown: boolean;
    portSecurityEnabled: boolean;
    portSecurityType: 'mac-address' | 'sticky' | null;
    maxMacAddresses: number;
    securityViolationMode: 'protect' | 'restrict' | 'shutdown';
    bpduGuardEnabled: boolean;
    portSecurityMacAddress?: string; // For storing specific MAC address if Port Security is set to mac-address
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
            console.log(`    Port Security: ${iface.portSecurityEnabled ? 'Enabled' : 'Disabled'}`);
            console.log(`    Port Security Type: ${iface.portSecurityType}`);
            console.log(`    Max MAC Addresses: ${iface.maxMacAddresses}`);
            console.log(`    Security Violation Mode: ${iface.securityViolationMode}`);
            console.log(`    BPDU Guard: ${iface.bpduGuardEnabled ? 'Enabled' : 'Disabled'}`);
            if (iface.portSecurityMacAddress) {
                console.log(`    Port Security MAC Address: ${iface.portSecurityMacAddress}`);
            }
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

    let interfaceid = 1
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
                id: interfaceid,
                name: interfaceName,
                shortname: generateShortName(interfaceName), // Set the shortname
                switchportMode: 'trunk',
                vlan: 1, // Default VLAN is usually 1
                shutdown: false,
                portSecurityEnabled: false,
                portSecurityType: null,
                maxMacAddresses: 1,
                securityViolationMode: 'shutdown', // Default violation mode
                bpduGuardEnabled: false,
                portSecurityMacAddress: undefined, // MAC address is optional
            };
            interfaceid += 1
        }

        if (currentInterface) {
            // Extract switchport mode
            if (line.includes('switchport mode')) {
                const modeMatch = line.match(/switchport mode (\S+)/);
                if (modeMatch) {
                    currentInterface.switchportMode = modeMatch[1] as SwitchInterface["switchportMode"]; // Assume that we get a string in the form of switchportMode
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

            // Parse Port Security settings
            if (line.includes('switchport port-security')) {
                currentInterface.portSecurityEnabled = true; // Port security is enabled
            }

            // Sticky MAC address configuration
            if (line.includes('switchport port-security mac-address sticky')) {
                currentInterface.portSecurityType = 'sticky';
            }

            // Max MAC address configuration
            if (line.includes('switchport port-security maximum')) {
                const maxMatch = line.match(/switchport port-security maximum (\d+)/);
                if (maxMatch) {
                    currentInterface.maxMacAddresses = parseInt(maxMatch[1], 10);
                }
            }

            // Violation mode configuration
            if (line.includes('switchport port-security violation')) {
                const violationMatch = line.match(/switchport port-security violation (\S+)/);
                if (violationMatch) {
                    currentInterface.securityViolationMode = violationMatch[1] as SwitchInterface["securityViolationMode"];
                }
            }

            // Specific MAC address for port security
            if (line.includes('switchport port-security mac-address')) {
                const macMatch = line.match(/switchport port-security mac-address (\S+)/);
                if (macMatch) {
                    currentInterface.portSecurityMacAddress = macMatch[1];
                }
            }

            // BPDU Guard configuration
            if (line.includes('spanning-tree bpduguard enable')) {
                currentInterface.bpduGuardEnabled = true;
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
