# Yangi matnlarga ovoz yozib, mp3 paket oxiriga qo'shadi va js ro'yxatini yangilaydi.
# Ishlatish: python tools/ovoz.py kerak.json [app/audio.js app/ovozlar.mp3 AUDIO]
# Kalit "§ovoz§matn" bo'lsa shu ovoz bilan (IELTS: Britaniya, Avstraliya, Irlandiya aksentlari), aks holda Andrew.
import asyncio, json, os, sys, re
import edge_tts

VOICE = "en-US-AndrewNeural"
AJS = sys.argv[2] if len(sys.argv) > 2 else "app/audio.js"
MP3 = sys.argv[3] if len(sys.argv) > 3 else "app/ovozlar.mp3"
VAR = sys.argv[4] if len(sys.argv) > 4 else "AUDIO"
# ovoz topilmasa (xizmat nomini o'zgartirsa) shunga yaqin ovoz bilan yoziladi, kalit o'zgarmaydi
ZAXIRA = {"en-GB-ThomasNeural": "en-GB-RyanNeural", "en-IE-ConnorNeural": "en-GB-RyanNeural", "en-GB-LibbyNeural": "en-GB-SoniaNeural",
          "en-AU-NatashaNeural": "en-GB-SoniaNeural", "en-GB-RyanNeural": VOICE, "en-GB-SoniaNeural": "en-US-JennyNeural",
          "en-US-JennyNeural": "en-US-AriaNeural", "en-GB-MaisieNeural": "en-GB-SoniaNeural", "en-AU-WilliamNeural": "en-GB-RyanNeural"}

def oqi():
    if not os.path.exists(AJS):
        return {"name": VAR, "files": {}}
    s = open(AJS, encoding="utf-8").read()
    return json.loads(re.search(r"window\.%s\s*=\s*(\{.*\})\s*;?\s*$" % VAR, s, re.S).group(1))

def ajrat(kalit):
    if kalit.startswith("§"):
        _, v, t = kalit.split("§", 2)
        return v, t
    return VOICE, kalit

async def yoz(kalit, sem):
    ovoz, text = ajrat(kalit)
    async with sem:
        for urinish in range(10):
            v = ZAXIRA.get(ovoz, VOICE) if urinish >= 4 and ovoz != VOICE else ovoz
            try:
                b = b""
                async for ch in edge_tts.Communicate(text, v).stream():
                    if ch["type"] == "audio":
                        b += ch["data"]
                if len(b) > 1000:
                    return kalit, b
            except Exception as e:
                print("xato", v, repr(text[:60]), e, flush=True)
            await asyncio.sleep(3 + urinish * 4)
        print("yozib bo'lmadi (keyingi safar qayta uriniladi):", repr(kalit[:80]), flush=True)
        return kalit, None

async def main():
    kerak = json.load(open(sys.argv[1], encoding="utf-8"))
    A = oqi()
    yangi = [t for t in kerak if t not in A["files"]]
    print(AJS, "yangi matnlar:", len(yangi), flush=True)
    if not yangi:
        return
    sem = asyncio.Semaphore(3)
    natija = await asyncio.gather(*(yoz(t, sem) for t in yangi))
    with open(MP3, "ab") as f:
        pos = f.tell()
        for t, b in natija:
            if b is None:
                continue
            f.write(b)
            A["files"][t] = [pos, len(b)]
            pos += len(b)
    with open(AJS, "w", encoding="utf-8") as f:
        f.write("window.%s = " % VAR + json.dumps(A, ensure_ascii=False, separators=(",", ":")) + ";\n")
    yoq = sum(1 for _, b in natija if b is None)
    print("tayyor:", len(A["files"]), "ta ovoz; yozilmay qolgan:", yoq, flush=True)
    if yoq > len(yangi) // 2:
        raise SystemExit("ko'p matn yozilmadi, ovoz xizmati ishlamayapti")

asyncio.run(main())
