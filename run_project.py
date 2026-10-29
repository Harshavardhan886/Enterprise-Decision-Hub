import os
import sys
import subprocess
import time
import webbrowser
import socket

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex(('127.0.0.1', port)) == 0

def main():
    print("=" * 60)
    print("       ENTERPRISE DECISION HUB - ALL-IN-ONE RUNNER")
    print("=" * 60)
    print()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    python_exe = sys.executable

    # 1. Start ML Microservice (Port 8000)
    print("[1/3] Starting ML Microservice on port 8000...")
    ml_dir = os.path.join(base_dir, "ml-service")
    try:
        subprocess.Popen([python_exe, "app.py"], cwd=ml_dir)
        print("      ✓ ML Service process spawned.")
    except Exception as e:
        print(f"      ✗ Error starting ML service: {e}")

    # 2. Start Backend (Port 8081)
    print("[2/3] Starting Spring Boot Backend on port 8081...")
    backend_bat = os.path.join(base_dir, "run-backend.bat")
    if os.path.exists(backend_bat):
        try:
            subprocess.Popen([backend_bat], cwd=base_dir, shell=True)
            print("      ✓ Backend process spawned.")
        except Exception as e:
            print(f"      ✗ Error starting Backend: {e}")

    # 3. Start Frontend (Port 3000)
    print("[3/3] Starting Frontend Web Server on port 3000...")
    frontend_dir = os.path.join(base_dir, "frontend")
    
    # Try npm start first if npm is available
    started_frontend = False
    try:
        # Check npm
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        subprocess.Popen([npm_cmd, "start"], cwd=frontend_dir, shell=True)
        print("      ✓ React dev server spawned.")
        started_frontend = True
    except Exception:
        pass

    if not started_frontend:
        # Fallback to python serving build folder
        build_dir = os.path.join(frontend_dir, "build")
        try:
            subprocess.Popen([python_exe, "-m", "http.server", "3000"], cwd=build_dir)
            print("      ✓ Static frontend server spawned.")
            started_frontend = True
        except Exception as e:
            print(f"      ✗ Error starting static server: {e}")

    print()
    print("Waiting 3 seconds for servers to initialize...")
    time.sleep(3)

    target_url = "http://localhost:3000"
    print(f"Opening browser at: {target_url}")
    webbrowser.open(target_url)

    print()
    print("=" * 60)
    print("  Enterprise Decision Hub is now RUNNING!")
    print("  - Frontend: http://localhost:3000")
    print("  - Backend:  http://localhost:8081")
    print("  - ML API:   http://localhost:8000")
    print("=" * 60)
    print("Press Ctrl+C in this window to stop all services.")
    print()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping Enterprise Decision Hub...")

if __name__ == "__main__":
    main()
