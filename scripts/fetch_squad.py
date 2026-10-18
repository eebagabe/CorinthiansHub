"""Gera data/players.json a partir do elenco principal na Wikipedia (EN), com fotos do Commons."""
import json
import re
import urllib.parse
import urllib.request

API = "https://en.wikipedia.org/w/api.php"
UA = {"User-Agent": "corinthians-hub/0.1"}
POS = {"GK": "Goleiro", "DF": "Defensor", "MF": "Meio-campista", "FW": "Atacante"}


def api(**params):
    url = API + "?" + urllib.parse.urlencode({"format": "json", "formatversion": 2, **params})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r:
        return json.load(r)


wikitext = api(action="parse", page="SC_Corinthians_Paulista", prop="wikitext")["parse"]["wikitext"]
squad = wikitext.split("===First-team squad===", 1)[1].split("{{Fs end}}", 1)[0]

players = []
for m in re.finditer(r"\{\{Fs player\|no=(\d*)\|nat=(\w+)\|pos=(\w+)\|name=\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", squad):
    no, nat, pos, title, label = m.groups()
    players.append({"numero": int(no), "nome": label or title, "posicao": POS[pos], "nacionalidade": nat, "wiki": title})
assert players, "elenco nao encontrado no wikitext"

pages = api(action="query", prop="pageimages", piprop="thumbnail", pithumbsize=400, redirects=1,
            titles="|".join(p["wiki"] for p in players))["query"]
redirects = {r["from"]: r["to"] for r in pages.get("redirects", [])}
normalized = {n["from"]: n["to"] for n in pages.get("normalized", [])}
thumbs = {p["title"]: p.get("thumbnail", {}).get("source") for p in pages["pages"]}
for p in players:
    t = normalized.get(p["wiki"], p["wiki"])
    p["foto"] = thumbs.get(redirects.get(t, t))
    del p["wiki"]

with open("data/players.json", "w", encoding="utf-8") as f:
    json.dump(players, f, ensure_ascii=False, indent=2)
print(f"{len(players)} jogadores, {sum(1 for p in players if p['foto'])} com foto")
