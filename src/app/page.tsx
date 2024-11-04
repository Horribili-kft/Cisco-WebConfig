'use client'
import { useState } from "react";

export default function Home() {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  async function handleSSHConnect() {
    console.log('trying to connect')
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      // Make a POST request to the API route
      const response = await fetch('/api/ssh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Specify content type
        },
        body: JSON.stringify({
          hostname: '127.0.0.1',   // replace with actual values
          username: 'krissssz',    // replace with actual values
          password: '0997'         // replace with actual values
        }),
      });

      const data = await response.json();

      if (response.ok && data.output) {
        setOutput(data.output);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Fetch error:', err); // Log fetch errors
      setError('Failed to fetch SSH data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl">
        Cisco WebConfig

      </h1>
      <button onClick={() => console.log('pressed')}>BUTTON</button>






    </div>
  );
}
