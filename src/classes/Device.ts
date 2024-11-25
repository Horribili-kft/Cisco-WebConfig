// This file defines the default device interface. The device interface is meant to be used by other classes as implementations of devices.
// It also defines a method to detect what kind of device we are connecting to.
import { TerminalEntry } from "@/store/terminalStore";
import { SwitchInterface } from "./CiscoSwitch";
import { RouterInterface } from "./CiscoRouter";
import { LinuxInterface } from "./Linux";

export interface Device {
    hostname: string;
    type: 'cisco_switch' | 'cisco_router' | 'cisco_firewall' | 'linux' | 'windows' | 'unknown';
    ipAddress?: string;
    interfaces: SwitchInterface[] | LinuxInterface[] | RouterInterface[];

    fetchConfig(hostname: string, username: string, password: string, enablepass?: string): unknown;
    parseConfig(config: string | JSON | { output: TerminalEntry[] }): void;
}

