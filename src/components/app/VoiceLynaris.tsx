"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Mic, MicOff, X, Loader2 } from "lucide-react"
import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { usePlan } from "@/hooks/usePlan"

// ── Types Web Speech API ──────────────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  [index: number]: { readonly transcript: string }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

// ── Types conversation ────────────────────────────────────────────────────────
interface ConvMsg {
  id: string
  role: "user" | "charles"
  content: string
  streaming?: boolean
}

// ── Wake words ────────────────────────────────────────────────────────────────
const WAKE_WORDS = [
  "ok linaris", "ok lynaris", "ok linarisse", "ok lynarisse",
  "oc linaris", "oc lynaris", "ok lynariss", "ok lynar",
  "okay linaris", "okay lynaris", "o linaris", "o lynaris",
  "linaris", "lynaris",
]

function normalize(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function detectWakeWord(text: string) {
  const n = normalize(text)
  return WAKE_WORDS.some(w => n.includes(normalize(w)))
}

function stripWakeWord(text: string) {
  let n = normalize(text)
  for (const w of WAKE_WORDS) n = n.replace(normalize(w), "")
  return n.replace(/^[\s,.'!?]+/, "").trim()
}

// ── Streaming vers Charles ────────────────────────────────────────────────────
async function streamCharles(
  history: MessageParam[],
  onChunk: (chunk: string) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch("/api/agents/charles/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({ messages: history }),
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "")
    let msg = `Erreur ${res.status}`
    try { msg = (JSON.parse(text) as { error?: string }).error ?? msg } catch { /* */ }
    // Erreurs techniques → message lisible, pas de badge "Non authentifié"
    const lower = msg.toLowerCase()
    if (lower.includes("non authentif") || lower.includes("401") || lower.includes("unauthenticated"))
      msg = "Session expirée — reconnecte-toi."
    throw new Error(msg)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const raw = line.slice(6).trim()
      if (raw === "[DONE]") return
      try {
        const parsed = JSON.parse(raw) as { content?: string; error?: string }
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.content) onChunk(parsed.content)
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e
      }
    }
  }
}

// ── Composant ─────────────────────────────────────────────────────────────────

type Phase = "idle" | "listening" | "thinking" | "responding"

export function VoiceLynaris() {
  const { limits, loading: planLoading } = usePlan()
  const [supported, setSupported] = useState(true)
  const [micOn, setMicOn] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [msgs, setMsgs] = useState<ConvMsg[]>([])
  const [interim, setInterim] = useState("") // texte en cours de dictée

  const phaseRef = useRef<Phase>("idle")
  const historyRef = useRef<MessageParam[]>([]) // historique envoyé à l'API
  const commandRef = useRef("")
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const intentionalAbort = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const updatePhase = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, interim])

  // Envoie la commande à Charles et gère la réponse
  const sendCommand = useCallback(async (text: string) => {
    if (!text.trim()) return

    setInterim("")
    commandRef.current = ""

    // Ajoute le message user dans l'UI et dans l'historique
    const userMsgId = crypto.randomUUID()
    setMsgs(prev => [...prev, { id: userMsgId, role: "user", content: text }])
    historyRef.current = [...historyRef.current, { role: "user", content: text }]

    // Placeholder Charles en streaming
    const charlesMsgId = crypto.randomUUID()
    setMsgs(prev => [...prev, { id: charlesMsgId, role: "charles", content: "", streaming: true }])

    updatePhase("thinking")
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    let fullResponse = ""

    try {
      await streamCharles(
        historyRef.current,
        (chunk) => {
          updatePhase("responding")
          fullResponse += chunk
          setMsgs(prev => prev.map(m =>
            m.id === charlesMsgId ? { ...m, content: fullResponse, streaming: true } : m
          ))
        },
        abortRef.current.signal,
      )
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errMsg = (err as Error).message || "Erreur inconnue"
        fullResponse = `⚠ ${errMsg}`
        setMsgs(prev => prev.map(m =>
          m.id === charlesMsgId ? { ...m, content: fullResponse, streaming: false } : m
        ))
      }
    }

    // Finalise le message Charles + ajoute dans l'historique
    setMsgs(prev => prev.map(m =>
      m.id === charlesMsgId ? { ...m, streaming: false } : m
    ))
    if (fullResponse && !fullResponse.startsWith("⚠")) {
      historyRef.current = [...historyRef.current, { role: "assistant", content: fullResponse }]
    }

    // Repart en écoute pour la suite de la conversation
    updatePhase("listening")
  }, [updatePhase])

  // Planifie l'envoi après 4s de silence
  const scheduleSend = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    silenceTimer.current = setTimeout(() => {
      const cmd = commandRef.current
      if (cmd.trim()) void sendCommand(cmd)
    }, 4000)
  }, [sendCommand])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    updatePhase("idle")
    setMsgs([])
    setInterim("")
    commandRef.current = ""
    historyRef.current = []
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    abortRef.current?.abort()
    intentionalAbort.current = true
    recognitionRef.current?.abort()
    setTimeout(() => {
      intentionalAbort.current = false
      try { recognitionRef.current?.start() } catch { /* */ }
    }, 400)
  }, [updatePhase])

  // Refs pour callbacks (évite de retrigger le useEffect d'init)
  const updatePhaseRef = useRef(updatePhase)
  const scheduleSendRef = useRef(scheduleSend)
  useEffect(() => { updatePhaseRef.current = updatePhase }, [updatePhase])
  useEffect(() => { scheduleSendRef.current = scheduleSend }, [scheduleSend])

  // Initialise la reconnaissance vocale UNE SEULE FOIS au mount
  useEffect(() => {
    const SpeechAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechAPI) { setSupported(false); return }

    const rec = new SpeechAPI()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = "fr-FR"

    let isRunning = false
    const safeStart = () => {
      if (isRunning) return
      try {
        rec.start()
        isRunning = true
      } catch (e) {
        const name = (e as Error).name
        // InvalidStateError = déjà démarré → considéré ok
        if (name === "InvalidStateError") {
          isRunning = true
        } else {
          console.warn("[VoiceLynaris] start failed:", name, (e as Error).message)
        }
      }
    }

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let text = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i]?.[0]?.transcript ?? ""
      }

      const p = phaseRef.current

      if (p === "idle") {
        if (detectWakeWord(text)) {
          const cmd = stripWakeWord(text)
          commandRef.current = cmd
          setInterim(cmd)
          setMsgs([])
          historyRef.current = []
          setIsOpen(true)
          updatePhaseRef.current("listening")
          if (cmd) scheduleSendRef.current()
        }
      } else if (p === "listening") {
        const cmd = stripWakeWord(text)
        commandRef.current = cmd
        setInterim(cmd)
        scheduleSendRef.current()
      }
    }

    rec.onerror = (e) => {
      const err = (e as Event & { error?: string }).error
      isRunning = false
      if (err === "aborted" || err === "no-speech") return
      if (err === "not-allowed" || err === "service-not-allowed") {
        console.warn("[VoiceLynaris] Permission micro refusée")
        setMicOn(false)
        return
      }
      if (localStorage.getItem("lynaris-voice-enabled") !== "0") {
        setTimeout(safeStart, 600)
      }
    }

    rec.onend = () => {
      isRunning = false
      if (intentionalAbort.current) { intentionalAbort.current = false; return }
      const p = phaseRef.current
      if ((p === "idle" || p === "listening") && localStorage.getItem("lynaris-voice-enabled") !== "0") {
        setTimeout(safeStart, 200)
      }
    }

    recognitionRef.current = rec

    // Démarrage initial : ON par défaut sauf désactivation explicite
    const enabled = localStorage.getItem("lynaris-voice-enabled") !== "0"
    if (enabled) {
      safeStart()
      setMicOn(true)
    } else {
      setMicOn(false)
    }

    // Watchdog — relance si Chromium tue le rec silencieusement (toutes les 8s)
    const watchdog = setInterval(() => {
      const stillEnabled = localStorage.getItem("lynaris-voice-enabled") !== "0"
      const p = phaseRef.current
      if (stillEnabled && !isRunning && (p === "idle" || p === "listening")) {
        safeStart()
        setMicOn(true)
      }
    }, 8000)

    // Écoute le toggle depuis VoiceLynarisCard
    function onToggle(e: Event) {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail
      if (detail.enabled) {
        safeStart()
        setMicOn(true)
      } else {
        intentionalAbort.current = true
        try { rec.abort() } catch { /* */ }
        isRunning = false
        setMicOn(false)
        if (phaseRef.current !== "idle") {
          updatePhaseRef.current("idle")
          setIsOpen(false)
          setMsgs([])
          setInterim("")
          commandRef.current = ""
          historyRef.current = []
        }
      }
    }
    window.addEventListener("lynaris:voice-toggle", onToggle)

    // Sync micOn à l'event de visibilité (au retour sur l'onglet, vérifie l'état)
    function onVisibility() {
      if (document.visibilityState === "visible") {
        const stillEnabled = localStorage.getItem("lynaris-voice-enabled") !== "0"
        if (stillEnabled && !isRunning) {
          safeStart()
          setMicOn(true)
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.removeEventListener("lynaris:voice-toggle", onToggle)
      document.removeEventListener("visibilitychange", onVisibility)
      clearInterval(watchdog)
      try { rec.abort() } catch { /* */ }
      isRunning = false
      setMicOn(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!supported) return null
  // Masqué pour les plans sans minutes voix (Essentiel, Trial)
  if (!planLoading && limits.voiceMinutes === 0) return null

  const isActive = phase !== "idle"

  return (
    <>
      {/* Panneau conversation */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Charles — Assistant vocal"
          aria-modal="true"
          style={{
            position: "fixed", bottom: 76, left: 24,
            width: "min(420px, calc(100vw - 48px))",
            background: "rgba(12,12,18,0.97)",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            border: "1px solid rgba(124,58,237,0.22)",
            borderRadius: 20,
            boxShadow: "0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)",
            zIndex: 9999,
            display: "flex", flexDirection: "column",
            maxHeight: "min(560px, calc(100dvh - 120px))",
            animation: "vlSlideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 14px 11px", flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9, fontSize: 15, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,38,200,0.15))",
              border: "1px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>🧠</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#F5F5F7", letterSpacing: "-0.01em" }}>Charles</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(245,245,247,0.4)" }}>
                {phase === "listening" ? "En écoute…"
                  : phase === "thinking" ? "Réflexion…"
                  : phase === "responding" ? "Répond…"
                  : "Prêt"}
              </p>
            </div>
            {(phase === "listening") && <WaveAnimation />}
            {(phase === "thinking" || phase === "responding") && (
              <Loader2 size={14} color="#7C3AED" style={{ animation: "vlSpin 1s linear infinite", flexShrink: 0 }} />
            )}
            <button type="button" onClick={handleClose} aria-label="Fermer" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(245,245,247,0.3)", padding: 4, display: "flex",
              borderRadius: 6, flexShrink: 0,
            }}>
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 8,
            scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}>
            {msgs.length === 0 && !interim && (
              <p style={{ margin: "auto", fontSize: 13, color: "rgba(245,245,247,0.25)", fontStyle: "italic", textAlign: "center" }}>
                Parle maintenant…
              </p>
            )}

            {msgs.map(m => (
              <div key={m.id} style={{
                padding: "9px 12px", borderRadius: 12,
                background: m.role === "user"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(124,58,237,0.07)",
                border: `1px solid ${m.role === "user" ? "rgba(255,255,255,0.07)" : "rgba(124,58,237,0.16)"}`,
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
              }}>
                <p style={{
                  margin: "0 0 3px",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: m.role === "user" ? "rgba(245,245,247,0.3)" : "rgba(124,58,237,0.55)",
                }}>
                  {m.role === "user" ? "Toi" : "Charles"}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#F5F5F7", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {m.content}
                  {m.streaming && <span style={{ opacity: 0.5, animation: "vlBlink 0.8s ease infinite" }}>▌</span>}
                </p>
              </div>
            ))}

            {/* Texte en cours de dictée */}
            {interim && phase === "listening" && (
              <div style={{
                padding: "9px 12px", borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.1)",
                alignSelf: "flex-end", maxWidth: "88%",
              }}>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(245,245,247,0.5)", lineHeight: 1.6, fontStyle: "italic" }}>
                  {interim}
                  <span style={{ opacity: 0.4, animation: "vlBlink 0.8s ease infinite" }}>▌</span>
                </p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* Indicateur "Ok Lynaris" */}
      {!isOpen && micOn && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            bottom: 70,
            left: 24,
            pointerEvents: "none",
            userSelect: "none",
            display: "flex",
            justifyContent: "flex-start",
            animation: "vlFadeIn 0.4s ease",
          }}
        >
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            fontStyle: "italic",
            color: "rgba(245,245,247,0.32)",
            letterSpacing: "0.04em",
            background: "rgba(10,10,16,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 6,
            padding: "3px 8px",
            border: "1px solid rgba(255,255,255,0.06)",
            whiteSpace: "nowrap",
          }}>
            Ok Lynaris
          </span>
        </div>
      )}

      {/* Bouton FAB */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) handleClose()
          else {
            setMsgs([])
            historyRef.current = []
            setInterim("")
            setIsOpen(true)
            updatePhase("listening")
          }
        }}
        aria-label='Activer Charles — dites "Ok Lynaris"'
        title='Dites "Ok Lynaris" pour activer'
        style={{
          position: "fixed", bottom: 18, left: 18,
          width: 40, height: 40, borderRadius: "50%",
          border: isActive ? "1.5px solid rgba(124,58,237,0.45)" : "1px solid rgba(255,255,255,0.09)",
          background: isActive ? "rgba(124,58,237,0.16)" : "rgba(12,12,18,0.88)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          boxShadow: isActive
            ? "0 0 0 0 rgba(124,58,237,0.25), 0 8px 24px rgba(0,0,0,0.5)"
            : "0 4px 16px rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 9998,
          transition: "border 0.2s, background 0.2s, box-shadow 0.2s",
          animation: isActive ? "vlPulse 2s ease infinite" : "none",
        }}
      >
        {micOn
          ? <Mic size={15} color={isActive ? "#A78BFA" : "rgba(245,245,247,0.45)"} />
          : <MicOff size={15} color="rgba(245,245,247,0.2)" />
        }
      </button>

      <style>{`
        @keyframes vlFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vlSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vlSpin { to { transform: rotate(360deg); } }
        @keyframes vlBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes vlPulse {
          0%,100% { box-shadow: 0 0 0 0   rgba(124,58,237,0.25), 0 8px 24px rgba(0,0,0,0.5); }
          50%      { box-shadow: 0 0 0 8px rgba(124,58,237,0.06), 0 8px 24px rgba(0,0,0,0.5); }
        }
      `}</style>
    </>
  )
}

function WaveAnimation() {
  return (
    <div aria-hidden style={{ display: "flex", alignItems: "center", gap: 2.5, height: 20, marginRight: 2, flexShrink: 0 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: 2.5, borderRadius: 999, background: "#7C3AED",
          animation: `vlWave 1.2s ease-in-out ${i * 0.14}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes vlWave {
          0%,100% { height: 4px; opacity: 0.35; }
          50%      { height: 15px; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
