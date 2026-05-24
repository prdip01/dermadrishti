import sys
import os

def check_env():
    print("🔍 Checking Environment...")
    print(f"Python Version: {sys.version}")
    
    # Check for Python 3.13 incompatibility on macOS ARM
    import platform
    if sys.platform == "darwin" and platform.machine() == "arm64" and sys.version_info.major == 3 and sys.version_info.minor == 13:
        print("\n⚠️  WARNING: Python 3.13 detected on macOS ARM.")
        print("   TensorFlow is currently unstable/incompatible with Python 3.13 on this architecture.")
        print("   The app will run in DEMO MODE to prevent crashes.")
        print("   💡 For full functionality, please use Python 3.11 or 3.12.")
    
    dependencies = [
        "flask",
        "flask_cors",
        "tensorflow",
        "PIL",
        "numpy",
        "cv2",
    ]
    
    missing = []
    for dep in dependencies:
        try:
            import importlib.util
            spec = importlib.util.find_spec(dep)
            if spec is not None:
                print(f"✅ {dep} is installed.")
            else:
                missing.append(dep)
                print(f"❌ {dep} is MISSING.")
        except Exception:
            missing.append(dep)
            print(f"❌ {dep} is MISSING.")
            
    if missing:
        print("\n⚠️ Missing dependencies found. Attempting to install...")
        return False
    
    print("\n✨ All dependencies are present!")
    return True

if __name__ == "__main__":
    if not check_env():
        sys.exit(1)
    sys.exit(0)
