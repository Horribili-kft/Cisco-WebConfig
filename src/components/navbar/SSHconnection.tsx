// Ez a komponens jelenleg nincs használva

//
'use client'; // This component is a client component

import { useState } from 'react';

const SSHClient = () => {
  const [hostname, setHostname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<StateType>('disconnected'); // Use StateType for state

  const handleConnect = async () => {
    try {
      await connectSSH(hostname, username, password);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
  };

  return (
    <div className="flex items-center space-x-2"> {/* Adjusted for horizontal layout */}
      <h1 className="text-sm font-bold">SSH Client</h1>
      {connectionStatus !== 'connected' ? ( // Check against 'connected'
        <>
          <input
            type="text"
            placeholder="Hostname"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            className="border border-gray-300 rounded-md p-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 rounded-md p-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-md p-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleConnect} // Updated to use handleConnect
            className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600 transition duration-200 text-sm"
          >
            Connect
          </button>
          <div className="text-sm text-red-500">{connectionStatus}</div>

        </>
      ) : (
        <>
          <div className="text-sm">Connected to SSH!</div> {/* Display connection status */}
          <svg
            width="16px"
            height="16px"
            viewBox="0 0 36.00 36.00"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
            className="iconify iconify--twemoji"
            fill="#000000"
          >
            <g>
              <path
                fill="#77B255"
                d="M36 32a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v28z"
              ></path>
              <path
                fill="#FFF"
                d="M29.28 6.362a2.502 2.502 0 0 0-3.458.736L14.936 23.877l-5.029-4.65a2.5 2.5 0 1 0-3.394 3.671l7.209 6.666c.48.445 1.09.665 1.696.665c.673 0 1.534-.282 2.099-1.139c.332-.506 12.5-19.27 12.5-19.27a2.5 2.5 0 0 0-.737-3.458z"
              ></path>
            </g>
          </svg>
          <button
            onClick={handleDisconnect} // Update to disconnected
            className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600 transition duration-200 text-sm"
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  );
};

export default SSHClient;
