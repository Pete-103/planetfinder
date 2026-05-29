import zipfile
import xml.etree.ElementTree as ET

def inspect_xlsm(filepath):
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            # Get sheet names
            if 'xl/workbook.xml' in z.namelist():
                workbook_content = z.read('xl/workbook.xml')
                root = ET.fromstring(workbook_content)
                namespaces = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                sheets = root.findall('.//ns:sheet', namespaces)
                print("Sheets:")
                for sheet in sheets:
                    print(f" - {sheet.attrib.get('name')} (id: {sheet.attrib.get('sheetId')})")
            
            # Read shared strings if they exist
            shared_strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                ss_content = z.read('xl/sharedStrings.xml')
                ss_root = ET.fromstring(ss_content)
                namespaces = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for si in ss_root.findall('ns:si', namespaces):
                    t = si.find('ns:t', namespaces)
                    if t is not None and t.text is not None:
                        shared_strings.append(t.text)
            print(f"\nTotal Shared Strings: {len(shared_strings)}")
            print("First 20 strings:")
            for s in shared_strings[:20]:
                print(f" - {s}")
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    inspect_xlsm('PlanetFinder.xlsm')
