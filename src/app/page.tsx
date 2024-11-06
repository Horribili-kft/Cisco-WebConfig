// components/SshConsole.tsx
'use client';
import { useSshStore } from '@/store/sshSlice';
import { useState } from 'react';

const SshConsole: React.FC = () => {
  const { execution, addCommand, executeCommands, commands } = useSshStore();
  const { output, error, loading } = execution;

  const [hostname, setHostname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [command, setCommand] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addCommand(command); // Add command to the store
    await executeCommands({ hostname, username, password, commands: [command] }); // Execute all commands including the new one
    setCommand(''); // Clear input after execution
  };

  return (
    <div className="console">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Hostname"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <textarea
          placeholder="Enter command(s)"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          rows={5} 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Executing...' : 'Execute'}
        </button>
      </form>

      <div className="output">
        <h3>Command History:</h3>
        {commands.map((cmd, index) => (
          <div key={index} className="command-history">
            <strong>Command:</strong> {cmd}
          </div>
        ))}
        {output && (
          <div>
            <h3>Output:</h3>
            <pre>{output}</pre>
          </div>
        )}
        {error && (
          <div className='text-red-700'>
            <h3>Error:</h3>
            <pre>{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SshConsole;
