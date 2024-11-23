#!/bin/bash

# Check if Node.js is installed, if not, install it
if ! command -v node &> /dev/null
then
    echo "Node.js not found. Installing Node.js..."
    # Install Node.js (using NodeSource for the latest version)
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed."
fi

# Check if npm is installed, if not, install it
if ! command -v npm &> /dev/null
then
    echo "npm not found. Installing npm..."
    sudo apt-get install -y npm
else
    echo "npm is already installed."
fi

# Run npm install to install dependencies from package.json
echo "Running npm install with dev dependencies and legacy-peer-deps..."
npm install --include=dev --legacy-peer-deps

# Check if Python is installed, if not, install it
if ! command -v python3 &> /dev/null
then
    echo "Python not found. Installing Python..."
    sudo apt-get update
    sudo apt-get install -y python python3-pip
else
    echo "Python is already installed."
fi

# Install Python dependencies from requirements.txt
if [ -f "requirements.txt" ]; then
    echo "Installing Python dependencies from requirements.txt..."
    python3 -m pip install --upgrade pip
    python3 -m pip install -r requirements.txt
else
    echo "requirements.txt not found. Skipping Python dependencies installation."
fi

echo "Setup complete!"
