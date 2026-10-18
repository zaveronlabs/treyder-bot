"""AI treyderni o'tgan shamlarda sinash (bir martalik): har bir sham uchun faqat o'sha paytgacha bo'lgan
ma'lumot beriladi. Miya fikri walk-forward bashoratlaridan (miya_tarix.json) olinadi, yangiliklar arxivi yo'q.

python orqaga.py <bo'lak> <bo'laklar soni> <shamlar soni> <oxirgi sham>  ->  orqaga_<bo'lak>.json
"""

import json
import sys

import treyder_ai as ai

bolak, jami, n = map(int, sys.argv[1:4])
oxirgi = sys.argv[4]
miya_tarix = json.load(open("miya_tarix.json"))
shamlar = {b: ai.yopilishlar(b) for b in ai.BELGILAR}
vaqtlar = [s[0] for s in shamlar["BTC"] if s[0] <= oxirgi][-n:]
natija = {}
for vaqt in vaqtlar[bolak::jami]:
    kesim = {b: [s for s in q if s[0] <= vaqt] for b, q in shamlar.items()}
    assert all(q[-1][0] == vaqt for q in kesim.values()), vaqt
    tangalar = ai.tangalar_tuz(kesim, miya_tarix.get(vaqt, {}), {})
    print("==", vaqt, flush=True)
    natija[vaqt] = ai.qaror_ber(vaqt, tangalar, None)
    json.dump(natija, open(f"orqaga_{bolak}.json", "w"), ensure_ascii=False)
