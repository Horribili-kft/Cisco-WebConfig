// helpers/sshHelper.ts
export async function executeSSHCommands(
    hostname: string, 
    username: string, 
    password: string, 
    commands?: string[]
  ): Promise<{ output?: string, error?: string }> {
    try {
      // Prepare the request body
      const requestBody = {
        hostname,
        username,
        password,
        ...(commands && { commands }), // Include commands only if present
      };
  
      // Make the POST request to the API
      const response = await fetch('/api/ssh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      // Parse the JSON response
      const result = await response.json();
  
      // Handle success and error cases
      if (!response.ok) {
        return { error: result.error || 'An unknown error occurred' };
      }
  
      return { output: result.output };
    } catch (err: any) {
      // Handle fetch or other unexpected errors
      return { error: err.message || 'Failed to execute SSH commands' };
    }
  }
  