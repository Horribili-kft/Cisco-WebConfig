import { useState } from "react";

interface CommandsProps {
  appendCommand: (command: string) => void; // Prop to pass the appendCommand function
}

const Commands: React.FC<CommandsProps> = ({ appendCommand }) => {
  const [toggleState, setToggleState] = useState(false);
  const [vlanInput, setVlanInput] = useState("");
  const [macAddressInput, setMacAddressInput] = useState("");
  const [agingValue, setAgingValue] = useState("");
  const [activeMode, setActiveMode] = useState<
    "Trunk" | "Access" | "MAC-Address" | "Sticky" | "Absolute" | "Inactive" | "Shutdown" | "Restrict" | "Protect" | null
  >(null);

  const handleToggle = () => {
    setToggleState(!toggleState);
    // Append the "no shutdown" or "shutdown" based on the toggle state
    if (toggleState) {
      appendCommand("shutdown");
    } else {
      appendCommand("no shutdown");
    }
  };

  const handleButtonClick = (mode: string) => {
    setActiveMode(mode as any);

    if (mode === "Trunk" || mode === "Access") {
      if (vlanInput.trim() === "") {
        alert("Please enter a VLAN number before selecting a mode.");
        return;
      }

      if (mode === "Trunk") {
        appendCommand(`switchport mode trunk`);
        appendCommand(`switchport trunk allowed vlan ${vlanInput}`);
      } else if (mode === "Access") {
        appendCommand(`switchport mode access`);
        appendCommand(`switchport access vlan ${vlanInput}`);
      }
    } else if (mode === "MAC-Address") {
      if (macAddressInput.trim() === "") {
        alert("Please enter a MAC address before selecting this mode.");
        return;
      }
      appendCommand(`switchport port-security mac-address ${macAddressInput}`);
    } else if (mode === "Sticky") {
      appendCommand("switchport port-security mac-address sticky");
    } else if (mode === "Absolute" || mode === "Inactive") {
      if (agingValue.trim() === "") {
        alert("Please enter an aging time before selecting this mode.");
        return;
      }
      appendCommand(`switchport port-security aging time ${agingValue}`);
      appendCommand(`switchport port-security aging type ${mode.toLowerCase()}`);
    } else if (mode === "Shutdown" || mode === "Restrict" || mode === "Protect") {
      appendCommand(`switchport port-security violation ${mode.toLowerCase()}`);
    } else {
      appendCommand(`switchport mode ${mode.toLowerCase()}`);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setInput(e.target.value);
  };

  const getButtonClass = (mode: string, defaultClass: string) => {
    return `btn w-1/4 ${activeMode === mode ? "btn-primary" : defaultClass}`;
  };

  return (
    <div className="p-6 border-t border-base-300 space-y-6 rounded-lg shadow-lg bg-neutral">
      {/* Toggle On/Off */}
      <div className="flex items-center mb-4">
        <label className="label cursor-pointer">
          <span className="label-text mr-4">OFF/ON</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={toggleState}
            onChange={handleToggle}
          />
        </label>
      </div>

      {/* Section: VLAN Configuration */}
      <div>
        <h2 className="text-lg font-bold mb-2">VLAN Configuration</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Enter VLAN Numbers"
            className="input input-bordered w-full"
            value={vlanInput}
            onChange={(e) => handleInputChange(e, setVlanInput)}
          />
          <button
            className={getButtonClass("Trunk", "btn-secondary")}
            onClick={() => handleButtonClick("Trunk")}
          >
            Switch Mode Trunk
          </button>
          <button
            className={getButtonClass("Access", "btn-accent")}
            onClick={() => handleButtonClick("Access")}
          >
            Switch Mode Access
          </button>
        </div>
      </div>

      {/* Section: MAC Address Configuration */}
      <div>
        <h2 className="text-lg font-bold mb-2">Switchport security</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Enter MAC Address"
            className="input input-bordered w-full"
            value={macAddressInput}
            onChange={(e) => handleInputChange(e, setMacAddressInput)}
          />
          <button
            className="btn btn-secondary"
            onClick={() => handleButtonClick("MAC-Address")}
          >
            MAC-Address
          </button>
          <button
            className={getButtonClass("Sticky", "btn-accent")}
            onClick={() => handleButtonClick("Sticky")}
          >
            Sticky
          </button>
        </div>
      </div>

      {/* Section: Port Security Aging */}
      <div>
        <h2 className="text-lg font-bold mb-2">Port Security Aging</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Enter Aging Time (in minutes)"
            className="input input-bordered w-full"
            value={agingValue}
            onChange={(e) => handleInputChange(e, setAgingValue)}
          />
          <button
            className={getButtonClass("Absolute", "btn-secondary")}
            onClick={() => handleButtonClick("Absolute")}
          >
            Absolute
          </button>
          <button
            className={getButtonClass("Inactive", "btn-accent")}
            onClick={() => handleButtonClick("Inactive")}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Section: Port Violation Action */}
      <div>
        <h2 className="text-lg font-bold mb-2">Port Violation Action</h2>
        <div className="flex items-center space-x-6">
          <button
            className={getButtonClass("Shutdown", "btn-secondary")}
            onClick={() => handleButtonClick("Shutdown")}
          >
            Shutdown
          </button>
          <button
            className={getButtonClass("Restrict", "btn-accent")}
            onClick={() => handleButtonClick("Restrict")}
          >
            Restrict
          </button>
          <button
            className={getButtonClass("Protect", "btn-secondary")}
            onClick={() => handleButtonClick("Protect")}
          >
            Protect
          </button>
        </div>
      </div>
    </div>
  );
};

export default Commands;
