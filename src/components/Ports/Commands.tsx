import { useState } from "react";

export default Commands;

function Commands() {
  const [toggleState, setToggleState] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeMode, setActiveMode] = useState<"Trunk" | "Access" | null>(null);

  const handleToggle = () => {
    setToggleState(!toggleState);
    console.log("Toggle State:", !toggleState ? "On" : "Off");
  };

  const handleButtonClick = (mode: "Trunk" | "Access") => {
    setActiveMode(mode);
    if (!inputValue) {
      console.error("Input cannot be empty!");
      return;
    }
    console.log(`Switch Mode: ${mode}, Value: ${inputValue}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Restrict input to numbers only
    if (/^\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  return (
    <div className="p-6 border-t border-base-300 space-y-4 rounded-lg shadow-lg bg-neutral">
      {/* Toggle On/Off */}
      <div className="flex items-center mb-4">
        <label className="label cursor-pointer">
          <span className="label-text mr-4">Toggle Off/On</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={toggleState}
            onChange={handleToggle}
          />
        </label>
      </div>

      {/* Row for Buttons and Input Field */}
      <div className="flex items-center space-x-6">
        {/* Switch Mode Trunk Button */}

        {/* Textarea for VLAN Numbers */}
        <input
          type="text"
          placeholder="Enter VLAN Numbers"
          className="input input-bordered w-1/3"
          value={inputValue}
          onChange={handleInputChange}
        />
        <button
          className={`btn w-1/3 ${
            activeMode === "Trunk" ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => handleButtonClick("Trunk")}
        >
          Switch Mode Trunk
        </button>

        {/* Switch Mode Access Button */}
        <button
          className={`btn w-1/3 ${
            activeMode === "Access" ? "btn-primary" : "btn-accent"
          }`}
          onClick={() => handleButtonClick("Access")}
        >
          Switch Mode Access
        </button>
      </div>
    </div>
  );
}
