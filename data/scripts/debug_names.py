import json, re

def norm(name: str) -> str:
    n = name.strip().lower()
    n = re.sub(r"['\u2019\-\.]", " ", n)
    n = re.sub(r"\s+", " ", n)
    return n

gj = json.load(open("data/raw/limadmin.geojson"))["communes"]["features"]
gj_names = {norm(f["properties"]["COMMUNE"]): f["properties"]["COMMUNE"] for f in gj}
prix = json.load(open("data/processed/prix.json"))
for key in prix:
    print("===", key)
    for n in sorted(prix[key]):
        if norm(n) not in gj_names:
            print("  NO MATCH:", repr(n))
