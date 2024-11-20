# Check if Node.js is installed, if not, install it
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found. Installing Node.js..."
    # You can download the Node.js installer here: https://nodejs.org/en/download/
    Start-Process "msiexec.exe" -ArgumentList "/i", "https://nodejs.org/dist/v18.x/node-v18.x.x-x64.msi", "/quiet" -Wait
} else {
    Write-Host "Node.js is already installed."
}

# Check if npm is installed, if not, install it
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm not found. Installing npm..."
    npm install -g npm
} else {
    Write-Host "npm is already installed."
}

# Run npm install to install dependencies from package.json
Write-Host "Running npm install..."
npm install --include=dev --legacy-peer-deps

# Check if Python is installed, if not, install it
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found. Installing Python..."
    # You can download the Python installer here: https://www.python.org/downloads/
    Start-Process "msiexec.exe" -ArgumentList "/i", "https://www.python.org/ftp/python/3.x.x/python-3.x.x-amd64.exe", "/quiet" -Wait
} else {
    Write-Host "Python is already installed."
}

# Install Python dependencies from requirements.txt
if (Test-Path "requirements.txt") {
    Write-Host "Installing Python dependencies from requirements.txt..."
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
} else {
    Write-Host "requirements.txt not found. Skipping Python dependencies installation."
}

Write-Host "Setup complete!"
