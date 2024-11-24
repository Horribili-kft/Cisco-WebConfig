import { create } from 'zustand';
import { Device } from '@/classes/Device';
import detectDeviceType from '@/helpers/detectDeviceType';
import CiscoSwitch from '@/classes/CiscoSwitch';
import LinuxDevice from '@/classes/Linux';
import CiscoRouter from '@/classes/CiscoRouter';
import { persist } from 'zustand/middleware';
import { useTerminalStore } from './terminalStore';

interface DeviceStore {
    loading: { state: boolean, msg: string | null }
    device: Device | null;
    connection: {
        hostname: string;
        username: string;
        password: string;
        enablepass: string;
        state: boolean;  // true if connected, false if not
    };
    setDevice: (device: Device) => void;
    connectToDevice: (hostname: string, username: string, password: string, enablepass?: string) => Promise<boolean>;
    disconnect: () => void;
}


export const useDeviceStore = create<DeviceStore>()(
    // We store this in localstorage

    persist(
        (set) => ({
            loading: { state: false, msg: null },
            device: null,

            // Initial empty connection state
            connection: {
                hostname: "",
                username: "",
                password: "",
                enablepass: "",
                state: false,
            },

            // Set the current device in the store
            setDevice: (device) => set({ device }),

            // Connect to a device, detect its type, and initialize the device object
            connectToDevice: async (hostname, username, password, enablepass) => {
                // For loggin errors
                const { addTerminalEntry } = useTerminalStore.getState();

                set({ loading: { state: true, msg: 'Trying to connect...' } })
                try {
                    // Step 1: Test connection to the device (we do not do this anymore, as it was redundant)
                    /*
                    const connectionResponse = await apicall({
                        hostname,
                        username,
                        password,
                        commands: [],
                    });
                    
                    const data = await connectionResponse.json();
        
                    if (!connectionResponse.ok) {
                        throw new Error(data.content || 'Connection failed');
                    }
        
                    const terminalEntries: TerminalEntry[] = data.output;
                    terminalEntries.forEach((entry) => addTerminalEntry(entry.content, entry.type));
        
        
        
                    // If there's at least one "output" entry, assume the connection was successful
                    const isConnected = terminalEntries.some(entry => entry.type === 'output' && entry.content.includes('Successfully connected'));
                    if (!isConnected) {
                        throw new Error(data[0].error || 'Connection failed');
                    }
                    */

                    set({ loading: { state: true, msg: 'Detecting device type...' } })

                    // Step 2: Detect the device type using specific commands
                    const deviceType = await detectDeviceType(hostname, username, password, enablepass);
                    let device: Device | null = null;
                    console.log(`${deviceType} detected`)

                    // Step 3: Instantiate the correct class based on device type
                    switch (deviceType) {
                        // TODO:
                        // Implement more types. 
                        case 'cisco_switch':
                            device = new CiscoSwitch(hostname);  // hostname assumed as IP for now
                            break;
                        case 'cisco_router':
                            device = new CiscoRouter(hostname);
                            break
                        case 'linux':
                            device = new LinuxDevice(hostname);
                            break;

                        /*
                        case 'windows'
                            
                        */
                        default:
                            throw new Error(`Unsupported device type: ${deviceType}`);
                    }


                    if (device) {
                        set({ loading: { state: true, msg: 'Fetching configuration...' } })

                        console.log(device)

                        // Step 4: Fetch the configuration for the device
                        await device.fetchConfig(hostname, username, password, enablepass)

                        // Step 5: Set the device in the store and update the connection state
                        set({
                            device,
                            connection: {
                                hostname,
                                username,
                                password,
                                enablepass: enablepass || "",
                                state: true,
                            },
                            loading: { state: false, msg: null },
                        });
                        return true;
                    } else {
                        set({ loading: { state: false, msg: null } })
                        return false;
                    }

                } catch (error) {
                    addTerminalEntry('Error connecting to / detecting device','error');
                    set({
                        connection: {
                            hostname: "",
                            username: "",
                            password: "",
                            enablepass: "",
                            state: false,
                        },
                        device: null,
                        loading: { state: false, msg: null }
                    });
                    return false;
                }
            },

            // Disconnect from the current device
            disconnect: () => {
                // Disconnect logic
                set({
                    device: null,
                    connection: {
                        hostname: "",
                        username: "",
                        password: "",
                        enablepass: "",
                        state: false,
                    },
                });
            },
        }),
        {
            name: 'device-store'
        }
    )

);
