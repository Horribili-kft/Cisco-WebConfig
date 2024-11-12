interface InterfaceConfig {
    name: string;
    switchportMode: string;
    vlan: number;
    shutdown: boolean;
}

interface VlanConfig {
    id: number;
    name: string;
}

export default class Switch {
    hostname: string;
    version: string;
    interfaces: InterfaceConfig[];
    vlans: VlanConfig[];
    runningConfig: string;

    constructor(runningConfig: string) {
        this.runningConfig = runningConfig;
        this.hostname = '';
        this.version = '';
        this.interfaces = [];
        this.vlans = [];
        this.initializeFromConfig();
    }

    // Method to initialize the switch with running config output
    private initializeFromConfig(): void {
        const parsedConfig = parseRunningConfig(this.runningConfig);

        this.hostname = parsedConfig.hostname;
        this.version = parsedConfig.version;
        this.interfaces = parsedConfig.interfaces;
        this.vlans = parsedConfig.vlans;
    }

    // Method to get details about a specific interface by name
    getInterfaceDetails(interfaceName: string): InterfaceConfig | undefined {
        return this.interfaces.find((iface) => iface.name === interfaceName);
    }

    // Method to display a summary of the switch configuration
    displayConfig(): void {
        console.log(`Switch Hostname: ${this.hostname}`);
        console.log(`Switch Version: ${this.version}`);
        console.log('Interfaces:');
        this.interfaces.forEach((iface) => {
            console.log(`  - Interface ${iface.name}: Switchport Mode ${iface.switchportMode}, VLAN ${iface.vlan}, Shutdown ${iface.shutdown ? 'Yes' : 'No'}`);
        });
        console.log('VLANs:');
        this.vlans.forEach((vlan) => {
            console.log(`  - VLAN ${vlan.id}: ${vlan.name}`);
        });
    }

    // Method to get raw running config
    getRawRunningConfig(): string {
        return this.runningConfig;
    }
}

// Parsing the running config to extract useful information
export function parseRunningConfig(config: string): { hostname: string; version: string; interfaces: InterfaceConfig[]; vlans: VlanConfig[] } {
    const configLines = config.split('\n');

    const interfaces: InterfaceConfig[] = [];
    const vlans: VlanConfig[] = [];
    let hostname = '';
    let version = '';

    let currentInterface: InterfaceConfig | null = null;

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

        // Parse VLANs (simple parsing for VLANs)
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
