// This file defines the default device interface. The device interface is meant to be used by other classes as implementations of devices.
// It also defines a method to detect what kind of device we are connecting to.

export interface Device {
    hostname: string;
    type: 'cisco_switch' | 'cisco_router' | 'cisco_firewall' | 'linux' | 'windows' | 'unknown';
    ipAddress?: string;
    
    fetchConfig(hostname: string, username: string, password: string, enablepass?: string): unknown;
    parseConfig(config: string): void;
}

