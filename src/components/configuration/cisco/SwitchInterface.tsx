import Switch from "@/classes/CiscoSwitch";
import { useCommandStore } from "@/store/commandStore";
import { useDeviceStore } from "@/store/deviceStore";
import { useTerminalStore } from "@/store/terminalStore";
import { useEffect, useState } from "react";

interface CommandsProps {
  addCommand: (command: string) => void;
}

const Commands: React.FC<CommandsProps> = ({ addCommand }) => {
  const [shutdown, setShutdown] = useState(false);
  const [vlan, setVlan] = useState<string>("");
  const [mode, setMode] = useState<'trunk' | 'access'>('trunk');
  const [macAddress, setMacAddress] = useState<string>("");
  const [violation, setViolation] = useState<'protect' | 'restrict' | 'shutdown'>('shutdown');
  const [portSecurityEnabled, setPortSecurityEnabled] = useState(false);
  const [portSecurityType, setPortSecurityType] = useState<'mac-address' | 'sticky' | null>(null);
  const [maxMacAddresses, setMaxMacAddresses] = useState(1);
  const [bpduGuardEnabled, setBpduGuardEnabled] = useState(false);
  const [agingValue, setAgingValue] = useState<string>("");

  const { selectedInterfaces } = useCommandStore();
  const { addTerminalEntry } = useTerminalStore();
  const { device } = useDeviceStore();

  // Fetch selected interface and device settings
  useEffect(() => {
    if (device instanceof Switch && selectedInterfaces.size > 0) {
      const selectedInterfaceName = selectedInterfaces.values().next().value;
      const iface = device.interfaces.find((iface) => iface.name === selectedInterfaceName);
      if (iface) {
        setShutdown(iface.shutdown);
        setVlan(iface.vlan.toString());
        setMode(iface.switchportMode);
        setPortSecurityEnabled(iface.portSecurityEnabled);
        setPortSecurityType(iface.portSecurityType);
        setMaxMacAddresses(iface.maxMacAddresses);
        setViolation(iface.securityViolationMode);
        setMacAddress(iface.portSecurityMacAddress || "");
        setBpduGuardEnabled(iface.bpduGuardEnabled);
      }
    }
  }, [selectedInterfaces, device]);

  const generateInterfaceRangeCommand = (selectedInterfaces: Set<string>) => {
    return `interface range ${Array.from(selectedInterfaces).join(', ')}`;
  };

  const appendCommand = (command: string) => {
    addCommand(generateInterfaceRangeCommand(selectedInterfaces));
    addCommand(command);
  };

  // Input validation helper function
  const isValidVLAN = (vlanInput: string) => {
    const vlanNumber = parseInt(vlanInput, 10);
    return !isNaN(vlanNumber) && vlanNumber >= 1 && vlanNumber <= 4094;
  };

  const isValidMACAddress = (mac: string) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  // Handle shutdown toggle
  const handleToggleShutdown = () => {
    setShutdown(!shutdown);
    appendCommand(shutdown ? "no shutdown" : "shutdown");
  };

  // Handle VLAN mode change with validation
  const handleSwitchportMode = (selectedMode: 'access' | 'trunk', vlanInput: string) => {
    if (!isValidVLAN(vlanInput)) {
      addTerminalEntry("Please enter a valid VLAN number (1-4094).", "error");
      return;
    }

    const modeCommand = selectedMode === 'trunk'
      ? `switchport mode trunk\nswitchport trunk allowed vlan ${vlanInput}`
      : `switchport mode access\nswitchport access vlan ${vlanInput}`;

    appendCommand(modeCommand);
  };

  // Handle port security commands
  const handlePortSecurity = (mode: string, macAddressInput: string, agingValueInput: string) => {
    switch (mode) {
      case "mac-address":
        if (!isValidMACAddress(macAddressInput)) {
          addTerminalEntry("Please enter a valid MAC address.", "error");
          return;
        }
        appendCommand(`switchport port-security mac-address ${macAddressInput}`);
        break;
      case "sticky":
        appendCommand("switchport port-security mac-address sticky");
        break;
      case "absolute":
      case "inactive":
        const agingTime = parseInt(agingValueInput, 10);
        if (isNaN(agingTime) || agingTime <= 0) {
          addTerminalEntry("Please enter a valid aging time (positive integer).", "error");
          return;
        }
        appendCommand(`switchport port-security aging time ${agingTime}`);
        appendCommand(`switchport port-security aging type ${mode.toLowerCase()}`);
        break;
      case "shutdown":
      case "restrict":
      case "protect":
        appendCommand(`switchport port-security violation ${mode.toLowerCase()}`);
        break;
      default:
        appendCommand(`switchport port-security ${mode.toLowerCase()}`);
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setInput(e.target.value);
  };

  return (
    <div className="p-6 border-t border-base-300 space-y-6 rounded-box shadow-lg bg-neutral">
      {/* Shutdown Toggle */}
      <div className="flex items-center mb-4">
        <label className="label cursor-pointer">
          <span className="label-text mr-4">Shutdown</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={shutdown}
            onChange={handleToggleShutdown}
          />
        </label>
      </div>

      {/* VLAN Configuration */}
      <div>
        <h2 className="text-lg font-bold mb-2">VLAN Configuration</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Enter VLAN Number"
            className="input input-bordered w-full"
            value={vlan}
            onChange={(e) => handleInputChange(e, setVlan)}
          />
          <button
            className="btn btn-secondary w-1/4"
            onClick={() => handleSwitchportMode('trunk', vlan)}
          >
            Trunk Mode
          </button>
          <button
            className="btn btn-accent w-1/4"
            onClick={() => handleSwitchportMode('access', vlan)}
          >
            Access Mode
          </button>
        </div>
      </div>

      {/* Port Security Configuration */}
      <div>
        <h2 className="text-lg font-bold mb-2">Port Security Configuration</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Enter MAC Address"
            className="input input-bordered w-full"
            value={macAddress}
            onChange={(e) => handleInputChange(e, setMacAddress)}
          />
          <button
            className="btn btn-secondary w-1/4"
            onClick={() => handlePortSecurity("mac-address", macAddress, '')}
          >
            MAC Address
          </button>
          <button
            className="btn btn-accent w-1/4"
            onClick={() => handlePortSecurity("sticky", "", '')}
          >
            Sticky
          </button>
        </div>
        <div className="flex items-center space-x-4 mt-4">
          <input
            type="text"
            placeholder="Enter Aging Time"
            className="input input-bordered w-full"
            value={agingValue}
            onChange={(e) => handleInputChange(e, setAgingValue)}
          />
          <button
            className="btn btn-secondary w-1/4"
            onClick={() => handlePortSecurity("absolute", "", agingValue)}
          >
            Absolute
          </button>
          <button
            className="btn btn-accent w-1/4"
            onClick={() => handlePortSecurity("inactive", "", agingValue)}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Port Security Violation Mode */}
      <div>
        <h2 className="text-lg font-bold mb-2">Port Violation Action</h2>
        <div className="flex items-center space-x-4">
          <button
            className="btn btn-secondary w-1/4"
            onClick={() => handlePortSecurity("shutdown", "", '')}
          >
            Shutdown
          </button>
          <button
            className="btn btn-accent w-1/4"
            onClick={() => handlePortSecurity("restrict", "", '')}
          >
            Restrict
          </button>
          <button
            className="btn btn-secondary w-1/4"
            onClick={() => handlePortSecurity("protect", "", '')}
          >
            Protect
          </button>
        </div>
      </div>

      {/* BPDU Guard Toggle */}
      <div className="flex items-center mb-4">
        <label className="label cursor-pointer">
          <span className="label-text mr-4">BPDU Guard</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={bpduGuardEnabled}
            onChange={() => setBpduGuardEnabled(!bpduGuardEnabled)}
          />
        </label>
      </div>
    </div>
  );
};

export default Commands;
