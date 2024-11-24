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
  const [vlan, setVlan] = useState("");
  const [mode, setMode] = useState<'trunk' | 'access'>('trunk');
  const [macAddress, setMacAddress] = useState("");
  const [violation, setViolation] = useState<'protect' | 'restrict' | 'shutdown'>('shutdown');
  const [portSecurityEnabled, setPortSecurityEnabled] = useState(false);
  const [portSecurityType, setPortSecurityType] = useState<'mac-address' | 'sticky' | null>(null);
  const [maxMacAddresses, setMaxMacAddresses] = useState(1);
  const [bpduGuardEnabled, setBpduGuardEnabled] = useState(false);
  const [agingValue, setAgingValue] = useState(""); // Added state for aging value

  const { selectedInterfaces } = useCommandStore();
  const { addTerminalEntry } = useTerminalStore()
  const { device } = useDeviceStore();

  // Fetch selected interface and device settings
  useEffect(() => {
    if (device instanceof Switch && selectedInterfaces.size !== 0) {
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
  }, [selectedInterfaces, device]); // Modified dependency array to trigger on `selectedInterfaces`
  
  const generateInterfaceRangeCommand = (selectedInterfaces: Set<string>) => {
    // Step 1: Convert Set to Array
    const interfacesArray = Array.from(selectedInterfaces);

    // Step 2: Join interfaces with commas to generate the range command
    const command = `interface range ${interfacesArray.join(', ')}`;

    // Step 3: Return the command
    return command;
  };


  function appendCommand(command: string) {
    addCommand(generateInterfaceRangeCommand(selectedInterfaces))
    addCommand(command)
  }

  // Handle shutdown toggle
  const handleToggleShutdown = () => {
    const newShutdownState = !shutdown;
    setShutdown(newShutdownState);
    appendCommand(newShutdownState ? "shutdown" : "no shutdown");
  };

  // Handle VLAN mode change
  const handleSwitchportMode = (mode: 'access' | 'trunk', vlanInput: string) => {
    if (vlanInput.trim() === "") {
      addTerminalEntry("Please enter a VLAN number.", 'error');
      return;
    }

    const modeCommand = mode === 'trunk'
      ? `switchport mode trunk\nswitchport trunk allowed vlan ${vlanInput}`
      : `switchport mode access\nswitchport access vlan ${vlanInput}`;

    appendCommand(modeCommand);
  };

  // Handle port security commands
  const handlePortSecurity = (mode: string, macAddressInput: string, agingValueInput: string) => {
    switch (mode) {
      case "mac-address":
        if (!macAddressInput.trim()) {
          addTerminalEntry("Please enter a MAC address.", 'error');
          return;
        }
        appendCommand(`switchport port-security mac-address ${macAddressInput}`);
        break;
      case "sticky":
        appendCommand("switchport port-security mac-address sticky");
        break;
      case "absolute":
      case "inactive":
        if (!agingValueInput.trim()) {
          addTerminalEntry("Please enter an aging time.", 'error');
          return;
        }
        appendCommand(`switchport port-security aging time ${agingValueInput}`);
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

      {/* Port Security */}
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
            onChange={(e) => handleInputChange(e, setAgingValue)}  // Use the correct state here
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
