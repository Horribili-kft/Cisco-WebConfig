import os
import platform
import shutil
import subprocess
import sys

# Cross platform script to compile the python binaries for standalone operation and faster execution. The JS code priorotizes the compiled binaries
PYTHON_FILES = ["ssh_cisco.py", "ssh_linux.py", "telnet_cisco.py"]  # Add your Python files here

# Get the current working directory (where the script is located)
SCRIPT_DIR = os.getcwd()
print(SCRIPT_DIR)

# Ensure that PyInstaller is installed
def check_pyinstaller():
    try:
        subprocess.check_call([sys.executable, "-m", "PyInstaller", "--version"])
    except subprocess.CalledProcessError:
        print("PyInstaller is not installed. Please install it first.")
        sys.exit(1)

PYINSTALLER_OPTIONS = ["--onefile", "--noconsole"]

def compile_executable(python_file, output_dir):
    """Compile the Python file using PyInstaller."""
    base_name = os.path.splitext(os.path.basename(python_file))[0]

    # Run the PyInstaller command
    print(f"Compiling {python_file}...")
    try:
        subprocess.check_call([sys.executable, "-m", "PyInstaller"] + PYINSTALLER_OPTIONS + ["--distpath", output_dir, python_file])
        print(f"Compilation of {python_file} successful! Executable is located in {output_dir}")
    except subprocess.CalledProcessError as e:
        print(f"Compilation of {python_file} failed: {e}")
        return False

    # If on Linux, make the compiled binary executable
    if platform.system().lower() == "linux":
        compiled_file = os.path.join(output_dir, base_name)
        if os.path.exists(compiled_file):
            try:
                # Make the compiled file executable
                print(f"Making {compiled_file} executable...")
                subprocess.check_call(["chmod", "+x", compiled_file])
                print(f"{compiled_file} is now executable!")
            except subprocess.CalledProcessError as chmod_error:
                print(f"Failed to make {compiled_file} executable: {chmod_error}")
                return False

    # Clean up build directory and .spec file
    print("Cleaning up temporary files...")
    spec_file = os.path.join(SCRIPT_DIR, f"{base_name}.spec")
    build_dir = os.path.join(SCRIPT_DIR, "build")
    
    # Remove build directory if it exists
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)  # This will remove the directory and its contents
    
    # Remove the .spec file if it exists
    if os.path.exists(spec_file):
        os.remove(spec_file)

    return True
def main():
    # Check if PyInstaller is installed
    check_pyinstaller()

    # Detect the platform
    current_platform = platform.system().lower()

    # Set a common output directory for both Windows and Linux
    output_dir = os.path.join(SCRIPT_DIR, "dist")
    print(output_dir)

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Loop over each Python file and compile it for the current platform
    for python_file in PYTHON_FILES:
        filepath = os.path.join(SCRIPT_DIR, python_file)
        print(filepath)
        if os.path.exists(filepath):

            if not compile_executable(python_file, output_dir):
                print(f"Failed to compile {python_file} for {current_platform}.")
        else:
            print(f"File {python_file} does not exist. Skipping...")

if __name__ == "__main__":
    main()
