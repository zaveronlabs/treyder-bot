"""AI treyder (pozitsiya + tajriba xotirasi + Fear & Greed bilan) o'tgan shamlarda sinovi, bir martalik.
Har bo'lak bitta tanga va vaqtning bir choragi; pozitsiya ketma-ket kuzatiladi (chorak boshida naqd).

python orqaga2.py <bo'lak 0..19> <shamlar soni> <oxirgi sham>  ->  orqaga_<bo'lak>.json
"""

import json
import sys

import tajriba
import treyder_ai as ai

bolak, n, oxirgi = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
belgi, chorak = ai.BELGILAR[bolak % 5], bolak // 5
miya_tarix = json.load(open("miya_tarix.json"))
tarix = {b: tajriba.tarix(b) for b in tajriba.BELGILAR}
xotira = tajriba.Xotira(tarix)
fg = tajriba.qorquv_tarixi()
vaqtlar = [s[0] for s in tarix["BTC"] if s[0] <= oxirgi][-n:]
qism = vaqtlar[chorak * n // 4:(chorak + 1) * n // 4]
pozitsiya, natija = {}, {}
for vaqt in qism:
    kesim = {b: [s for s in tarix[b] if s[0] <= vaqt][-2000:] for b in ai.BELGILAR}
    assert all(q[-1][0] == vaqt for q in kesim.values()), vaqt
    tangalar = ai.tangalar_tuz(kesim, miya_tarix.get(vaqt, {}), {}, xotira, pozitsiya, vaqt)
    print("==", vaqt, flush=True)
    q = ai.qaror_ber(vaqt, tangalar, None, tajriba.qorquv(fg, vaqt), faqat=[belgi])[belgi]
    if q["qaror"] == "long" and belgi not in pozitsiya:
        pozitsiya[belgi] = {"kirish_narx": tangalar[belgi]["narx"], "kirish_sana": vaqt}
    elif q["qaror"] != "long":
        pozitsiya.pop(belgi, None)
    natija[vaqt] = {belgi: q}
    json.dump(natija, open(f"orqaga_{bolak}.json", "w"), ensure_ascii=False)
