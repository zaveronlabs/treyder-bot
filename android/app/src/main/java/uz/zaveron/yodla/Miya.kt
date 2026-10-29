package uz.zaveron.yodla

import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import org.json.JSONObject

// Andrew'ning "miyasi": telefonning o'zida ishlaydigan til modeli (Gemma 4, LiteRT-LM), internetsiz
fun interface MiyaChiqish { fun yubor(json: String) }

class Miya(private val keshPapka: String, private val chiqish: MiyaChiqish) {
    private var engine: Engine? = null
    private var suhbat: Conversation? = null
    private var ish: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    private fun xabar(t: String, s: String = "") = chiqish.yubor(JSONObject().put("t", t).put("s", s).toString())

    // model yuklanadi (birinchi marta bir necha soniya) va yangi suhbat ochiladi
    fun boshla(modelYoli: String, tizim: String) {
        ish?.cancel()
        ish = scope.launch {
            try {
                if (engine == null) {
                    xabar("yuklanmoqda")
                    val e = Engine(EngineConfig(modelPath = modelYoli, backend = Backend.CPU(), cacheDir = keshPapka))
                    e.initialize()
                    engine = e
                }
                suhbat?.close()
                suhbat = engine!!.createConversation(ConversationConfig(systemInstruction = Contents.of(Content.Text(tizim))))
                xabar("tayyor")
            } catch (t: Throwable) {
                xabar("xato", t.message ?: t.toString())
            }
        }
    }

    // javob bo'lak-bo'lak keladi: "bolak" xabarlari, oxirida "tugadi"
    fun yoz(matn: String) {
        val s = suhbat ?: return xabar("xato", "suhbat ochilmagan")
        ish = scope.launch {
            try {
                s.sendMessageAsync(matn)
                    .catch { xabar("xato", it.message ?: it.toString()) }
                    .collect { xabar("bolak", it.toString()) }
                xabar("tugadi")
            } catch (t: Throwable) {
                xabar("xato", t.message ?: t.toString())
            }
        }
    }

    fun yop() {
        ish?.cancel()
        try { suhbat?.close() } catch (_: Throwable) { }
        try { engine?.close() } catch (_: Throwable) { }
        suhbat = null; engine = null
    }
}
