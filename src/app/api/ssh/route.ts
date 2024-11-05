// app/api/ssh/route.ts
import { NextResponse } from 'next/server';
import { Client } from 'ssh2';

// Utility function to establish SSH connection and run commands
async function runSSHCommands(hostname: string, username: string, password: string, commands: string[] | undefined): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let result = '';

    conn
      .on('ready', () => {
        if (!commands || commands.length === 0) {
          // If no commands are provided or the list is empty, resolve with a connection success message
          conn.end();
          resolve('SSH connection established successfully, no commands to run.');
        } else {
          // Execute each command in the list
          conn.exec(commands.join(' && '), (err, stream) => {
            if (err) {
              reject(`Error executing commands: ${err.message}`);
              conn.end();
              return;
            }

            stream
              .on('data', (data: any) => {
                result += data.toString(); // Accumulate command output
              })
              .on('close', () => {
                conn.end();
                resolve(result.trim()); // Resolve with the output
              })
              .stderr.on('data', (data) => {
                reject(`SSH Error: ${data.toString()}`);
              });
          });
        }
      })
      .on('error', (err) => {
        reject(`SSH Connection Error: ${err.message}`);
      })
      .connect({
        host: hostname,
        port: 22, // Default SSH port
        username: username,
        password: password,
      });
  });
}

// Handle the POST request
export async function POST(request: Request) {
  try {
    const { hostname, username, password, commands } = await request.json();

    // Validate required fields
    if (!hostname || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields: hostname, username, password.' }, { status: 400 });
    }

    // Run SSH commands or just establish the connection if no commands are provided
    const output = await runSSHCommands(hostname, username, password, commands);
    return NextResponse.json({ output });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
