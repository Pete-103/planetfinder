import zipfile
import xml.etree.ElementTree as ET

def extract_image_mapping(filepath):
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            # Get drawings
            if 'xl/drawings/drawing1.xml' in z.namelist():
                xml_content = z.read('xl/drawings/drawing1.xml')
                root = ET.fromstring(xml_content)
                namespaces = {
                    'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
                    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
                }
                
                # Get the rels to map rId to image files
                rels_content = z.read('xl/drawings/_rels/drawing1.xml.rels')
                rels_root = ET.fromstring(rels_content)
                rels_namespaces = {'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'}
                
                rId_to_target = {}
                for rel in rels_root.findall('rel:Relationship', rels_namespaces):
                    rId_to_target[rel.attrib['Id']] = rel.attrib['Target']

                print("Image mappings based on alt-text/title:")
                for pic in root.findall('.//xdr:pic', namespaces):
                    nvPicPr = pic.find('xdr:nvPicPr', namespaces)
                    cNvPr = nvPicPr.find('xdr:cNvPr', namespaces)
                    name = cNvPr.attrib.get('name', '')
                    desc = cNvPr.attrib.get('descr', '')
                    
                    blipFill = pic.find('xdr:blipFill', namespaces)
                    blip = blipFill.find('a:blip', namespaces)
                    rId = blip.attrib.get(f"{{{namespaces['r']}}}embed")
                    target = rId_to_target.get(rId, 'Unknown')
                    
                    print(f"{target} -> Name: {name}, Desc: {desc}")
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    extract_image_mapping('PlanetFinder.xlsm')
