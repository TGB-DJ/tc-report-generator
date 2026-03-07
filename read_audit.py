import json
import codecs

def read_audit():
    try:
        # Try reading with utf-8-sig to handle BOM
        with codecs.open('audit.json', 'r', 'utf-16') as f:
            content = f.read()
            # If it's actually not utf-16, try something else
            if not content.strip():
                 with codecs.open('audit.json', 'r', 'utf-8-sig') as f2:
                     content = f2.read()
        
        data = json.loads(content)
        vulnerabilities = data.get('vulnerabilities', {})
        print(f"Total vulnerabilities: {len(vulnerabilities)}")
        for pkg, details in vulnerabilities.items():
            print(f"- {pkg}: {details.get('severity')} (via {details.get('via')})")
            fix_available = details.get('fixAvailable')
            if fix_available:
                print(f"  Fix available: {fix_available}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_audit()
