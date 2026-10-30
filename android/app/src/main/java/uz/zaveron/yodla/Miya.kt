package uz.zaveron.yodla

import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject

// Andrew'ning "miyasi": telefonning o'zida ishlaydigan til modeli (Gemma 4, LiteRT-LM), internetsiz
fun interface MiyaChiqish { fun yubor(json: String) }

class Miya(private val keshPapka: String, private val sozlama: android.content.SharedPreferences, private val chiqish: MiyaChiqish) {
    private var engine: Engine? = null
    private var suhbat: Conversation? = null
    private var ish: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    // model bir vaqtda bitta ish qiladi: javob, tarjima va yangi suhbat navbat bilan
    private val navbat = Mutex()
    private var tizimMatn = ""
    private val tarix = mutableListOf<Message>()

    private fun xabar(t: String, s: String = "") = chiqish.yubor(JSONObject().put("t", t).put("s", s).toString())

    // model yuklanadi (birinchi marta bir necha soniya) va yangi suhbat ochiladi
    fun boshla(modelYoli: String, tizim: String) {
        ish?.cancel()
        ish = scope.launch {
            try { navbat.withLock {
                if (engine == null) {
                    xabar("yuklanmoqda")
                    engine = ochish(modelYoli)
                }
                suhbat?.close()
                tizimMatn = tizim; tarix.clear()
                suhbat = engine!!.createConversation(ConversationConfig(systemInstruction = Contents.of(Content.Text(tizim))))
                xabar("tayyor", qurilma)
            } } catch (t: Throwable) {
                xabar("xato", t.message ?: t.toString())
            }
        }
    }

    // avval GPU (ancha tez), bo'lmasa CPU. GPU ilovani yiqitsa, belgi qoladi va keyingi safar to'g'ri CPU olinadi
    private fun ochish(modelYoli: String): Engine {
        if (!sozlama.getBoolean("gpuYiqildi", false) && !sozlama.getBoolean("gpuSinov", false)) {
            sozlama.edit().putBoolean("gpuSinov", true).commit()
            try {
                val e = Engine(EngineConfig(modelPath = modelYoli, backend = Backend.GPU(), cacheDir = keshPapka))
                e.initialize()
                sozlama.edit().putBoolean("gpuSinov", false).apply()
                qurilma = "GPU"
                return e
            } catch (t: Throwable) {
                sozlama.edit().putBoolean("gpuSinov", false).putBoolean("gpuYiqildi", true).apply()
            }
        } else if (sozlama.getBoolean("gpuSinov", false)) {
            sozlama.edit().putBoolean("gpuSinov", false).putBoolean("gpuYiqildi", true).apply()
        }
        val e = Engine(EngineConfig(modelPath = modelYoli, backend = Backend.CPU(), cacheDir = keshPapka))
        e.initialize()
        qurilma = "CPU"
        return e
    }
    private var qurilma = ""

    // javob bo'lak-bo'lak keladi: "bolak" xabarlari, oxirida "tugadi"
    fun yoz(matn: String) {
        ish = scope.launch {
            try { navbat.withLock {
                val s = suhbat ?: return@withLock xabar("xato", "suhbat ochilmagan")
                val javob = StringBuilder()
                s.sendMessageAsync(matn)
                    .catch { xabar("xato", it.message ?: it.toString()) }
                    .collect { javob.append(it.toString()); xabar("bolak", it.toString()) }
                tarix += Message.user(matn); tarix += Message.model(javob.toString())
                xabar("tugadi")
            } } catch (t: Throwable) {
                xabar("xato", t.message ?: t.toString())
            }
        }
    }

    // Andrew'ning gapi alohida suhbatda o'zbekchaga o'giriladi (asosiy suhbat buzilmaydi)
    private val tarjimaSozlama get() = ConversationConfig(
        systemInstruction = Contents.of(Content.Text("You are a translator from English to Uzbek. Translate the user's English text into natural, casual Uzbek written in the Latin alphabet (o', g', sh, ch). Reply with only the Uzbek translation, nothing else. Never repeat the English.")),
        initialMessages = listOf(
            Message.user("Hey, what's up? What kind of music are you into?"),
            Message.model("Salom, nima gap? Qanaqa musiqa yoqadi senga?"),
            Message.user("That sounds awesome. Why do you think so?"),
            Message.model("Zo'r eshitilyapti. Nega unday deb o'ylaysan?"),
        ),
    )

    fun tarjima(id: String, matn: String) {
        scope.launch {
            val javob = JSONObject().put("t", "tarjima").put("id", id)
            try { navbat.withLock {
                val e = engine ?: throw IllegalStateException("miya yuklanmagan")
                val natija = try {
                    e.createConversation(tarjimaSozlama).use { it.sendMessage(matn).toString() }
                } catch (bitta: Throwable) {
                    // model bir vaqtda bitta suhbat ko'tarsa: asosiysini yopib, tarjimadan keyin tarixi bilan qayta ochamiz
                    suhbat?.close(); suhbat = null
                    try {
                        e.createConversation(tarjimaSozlama).use { it.sendMessage(matn).toString() }
                    } finally {
                        suhbat = e.createConversation(ConversationConfig(systemInstruction = Contents.of(Content.Text(tizimMatn)), initialMessages = tarix.toList()))
                    }
                }
                javob.put("s", natija.trim())
            } } catch (t: Throwable) {
                javob.put("xato", t.message ?: t.toString())
            }
            chiqish.yubor(javob.toString())
        }
    }

    fun yop() {
        ish?.cancel()
        try { suhbat?.close() } catch (_: Throwable) { }
        try { engine?.close() } catch (_: Throwable) { }
        suhbat = null; engine = null
    }
}
