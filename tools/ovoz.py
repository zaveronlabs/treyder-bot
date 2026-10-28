# Yangi matnlarga Andrew (en-US-AndrewNeural) ovozini yozib, app/ovozlar.mp3 oxiriga qo'shadi va app/audio.js ni yangilaydi.
# Ishlatish: python tools/ovoz.py kerak.json
import asyncio, json, sys, re
import edge_tts

VOICE = "en-US-AndrewNeural"
AJS = "app/audio.js"
MP3 = "app/ovozlar.mp3"

def oqi():
    s = open(AJS, encoding="utf-8").read()
    return json.loads(re.search(r"window\.AUDIO\s*=\s*(\{.*\})\s*;?\s*$", s, re.S).group(1))

async def yoz(text, sem):
    async with sem:
        for urinish in range(6):
            try:
                b = b""
                async for ch in edge_tts.Communicate(text, VOICE).stream():
                    if ch["type"] == "audio":
                        b += ch["data"]
                if len(b) > 1000:
                    return text, b
            except Exception as e:
                print("xato", repr(text), e, flush=True)
            await asyncio.sleep(2 + urinish * 3)
        raise SystemExit("yozib bo'lmadi: " + text)

async def main():
    kerak = json.load(open(sys.argv[1], encoding="utf-8"))
    A = oqi()
    yangi = [t for t in kerak if t not in A["files"]]
    print("yangi matnlar:", len(yangi), flush=True)
    if not yangi:
        return
    sem = asyncio.Semaphore(6)
    natija = await asyncio.gather(*(yoz(t, sem) for t in yangi))
    with open(MP3, "ab") as f:
        pos = f.tell()
        for t, b in natija:
            f.write(b)
            A["files"][t] = [pos, len(b)]
            pos += len(b)
    with open(AJS, "w", encoding="utf-8") as f:
        f.write("window.AUDIO = " + json.dumps(A, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("tayyor:", len(A["files"]), "ta ovoz", flush=True)

asyncio.run(main())
