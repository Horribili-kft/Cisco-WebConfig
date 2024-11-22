import { useState } from "react";

export default Commands;

function Commands() {
  const [toggleState, setToggleState] = useState(false);
  const [vlanInput, setVlanInput] = useState("");
  const [macAddressInput, setMacAddressInput] = useState("");
  const [agingValue, setAgingValue] = useState("");
  const [activeMode, setActiveMode] = useState<
    "Trunk" | "Access" | "MAC-Address" | "Sticky" | "Absolute" | "Inactive" | "Shutdown" | "Restrict" | "Protect" | null
  >(null);

  const handleToggle = () => {
    setToggleState(!toggleState);
    console.log("Toggle State:", !toggleState ? "On" : "Off");
  };

  const handleButtonClick = (mode: string) => {
    setActiveMode(mode as any);
    console.log(`Active Mode: ${mode}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setInput: React.Dispatch<React.SetStateAction<string>>) => {
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
          <span className="label-text mr-4">Toggle On/Off</span>
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
        <h2 className="text-lg font-bold mb-2">MAC Address Configuration</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Enter MAC Address"
            className="input input-bordered w-full"
            value={macAddressInput}
            onChange={(e) => handleInputChange(e, setMacAddressInput)}
          />

          <button
            className={getButtonClass("MAC-Address", "btn-secondary")}
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
            placeholder="Enter Aging Value"
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
        <div className="flex items-center space-x-6"> {/* Increased space between buttons */}
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
}
