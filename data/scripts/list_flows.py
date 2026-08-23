import xml.etree.ElementTree as ET

NS_S = "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure"
NS_C = "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common"
NS_XML = "{http://www.w3.org/XML/1998/namespace}lang"

root = ET.parse("/tmp/df2.xml").getroot()
flows = []
for df in root.findall(f".//{{{NS_S}}}Dataflow"):
    fid = df.get("id")
    ver = df.get("version")
    names = {e.get(NS_XML): (e.text or "") for e in df.findall(f"{{{NS_C}}}Name")}
    flows.append((fid, ver, names))

print("total:", len(flows))
KEYWORDS = [
    "commune", "recensement", "census", "activite economique",
    "activité économique", "chomage", "chômage", "emploi salarié",
    "emploi salarie", "taux d'activité", "taux de chomage",
]
for fid, ver, names in flows:
    blob = " ".join(names.values()).lower()
    if any(k in blob for k in KEYWORDS):
        short = {k: v[:65] for k, v in list(names.items())[:2]}
        print(fid, ver, "|", short)
