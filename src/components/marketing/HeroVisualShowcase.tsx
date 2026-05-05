"use client"

import { motion, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"

/**
 * HeroVisualShowcase — mise en scène immersive du hero landing.
 *
 * Composition :
 * - Photo de bureau premium (universelle, multi-secteur) en background avec Ken Burns
 * - Avatar Marine transparent en overlay (full body, float subtil)
 * - 3 bulles de chat flottantes autour de l'avatar (messages clients exemples)
 * - Particules dorées qui flottent (poussière de soleil)
 * - Glow lumineux derrière l'avatar
 *
 * Toutes les animations respectent prefers-reduced-motion.
 */

const FLOATING_MESSAGES = [
  { text: "Bonjour, je voudrais prendre rendez-vous", from: "client", delay: 0.5 },
  { text: "Bien sûr, j'ai un créneau jeudi 14h", from: "marine", delay: 1.4 },
  { text: "C'est noté, je vous envoie la confirmation", from: "marine", delay: 2.4 },
] as const

export function HeroVisualShowcase() {
  const reduceMotion = useReducedMotion()
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number; size: number }>>([])

  useEffect(() => {
    if (reduceMotion) return
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: (i * 0.4) % 6,
        size: 2 + Math.random() * 3,
      })),
    )
  }, [reduceMotion])

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl"
      style={{
        boxShadow:
          "0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {/* Background photo with Ken Burns */}
      <motion.div
        className="absolute inset-0"
        initial={reduceMotion ? false : { scale: 1.05, x: 0, y: 0 }}
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1.05, 1.12, 1.05],
                x: ["0%", "-2%", "0%"],
                y: ["0%", "1%", "0%"],
              }
        }
        transition={{
          duration: 22,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <Image
          src="/marketing/scenes/hero-universal.webp"
          alt="Bureau de dirigeant de petite entreprise française, lumière dorée"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 40vw"
          style={{ objectFit: "cover" }}
        />
        {/* Color grading overlay : warm + slight desaturation */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "linear-gradient(180deg, rgba(20,10,30,0.10) 0%, rgba(20,10,30,0.45) 100%), radial-gradient(ellipse at 65% 40%, rgba(124,58,237,0.18) 0%, transparent 65%)",
            mixBlendMode: "multiply",
          }}
        />
      </motion.div>

      {/* Floating golden particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: "rgba(255, 220, 150, 0.7)",
              boxShadow: "0 0 6px rgba(255, 200, 100, 0.5)",
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{
              opacity: [0, 0.9, 0.9, 0],
              y: [0, -40, -80, -120],
              x: [0, 8, -4, 12],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Avatar glow */}
      <div
        className="absolute pointer-events-none"
        aria-hidden
        style={{
          bottom: "-5%",
          right: "-10%",
          width: "75%",
          height: "75%",
          background:
            "radial-gradient(circle at center, rgba(34,211,238,0.35) 0%, rgba(124,58,237,0.18) 35%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Marine avatar overlay */}
      <motion.div
        className="absolute"
        style={{
          bottom: "-2%",
          right: "-8%",
          width: "75%",
          height: "auto",
        }}
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={
          reduceMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                y: [0, -8, 0],
              }
        }
        transition={{
          opacity: { duration: 1, delay: 0.3 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
        }}
      >
        <Image
          src="/agents/avatars/marine.png"
          alt="Marine — agente réceptionniste IA Lynaris"
          width={1024}
          height={1024}
          sizes="(max-width: 1024px) 80vw, 30vw"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.45))",
          }}
        />
      </motion.div>

      {/* Floating chat bubbles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {FLOATING_MESSAGES.map((msg, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: msg.from === "client" ? "5%" : undefined,
              right: msg.from === "marine" ? "8%" : undefined,
              top: `${15 + i * 15}%`,
              maxWidth: "62%",
            }}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: reduceMotion ? 0 : msg.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div
              className="rounded-2xl px-4 py-2.5 text-[13px] backdrop-blur-md"
              style={{
                background:
                  msg.from === "client"
                    ? "rgba(255,255,255,0.92)"
                    : "linear-gradient(135deg, rgba(34,211,238,0.95) 0%, rgba(20,180,200,0.95) 100%)",
                color: msg.from === "client" ? "#1A1A1F" : "#0A1820",
                fontWeight: 500,
                border:
                  msg.from === "client"
                    ? "1px solid rgba(0,0,0,0.06)"
                    : "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.2)",
                borderBottomLeftRadius: msg.from === "client" ? 4 : 16,
                borderBottomRightRadius: msg.from === "marine" ? 4 : 16,
              }}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status pill */}
      <motion.div
        className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(16,185,129,0.45)",
        }}
        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.8 }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background: "#10B981",
            boxShadow: "0 0 8px rgba(16,185,129,0.8)",
            animation: reduceMotion ? undefined : "pulse-dot 1.6s ease-in-out infinite",
          }}
        />
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: "#F5F5F7" }}>
          MARINE EN LIGNE
        </span>
      </motion.div>

      {/* Sector ticker */}
      <div
        className="absolute bottom-3 left-3 right-3 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="px-3 py-2 flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#71717A" }}>
            Pour
          </span>
          <div className="flex-1 overflow-hidden">
            <motion.div
              className="flex gap-4 whitespace-nowrap"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      x: ["0%", "-50%"],
                    }
              }
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {[
                "Kinésithérapeutes",
                "Restaurants",
                "Agences immobilières",
                "Cabinets dentaires",
                "Salons de coiffure",
                "Artisans",
                "Avocats",
                "Vétérinaires",
                "Consultants",
                "Coachs sportifs",
                "Kinésithérapeutes",
                "Restaurants",
                "Agences immobilières",
                "Cabinets dentaires",
                "Salons de coiffure",
                "Artisans",
                "Avocats",
                "Vétérinaires",
                "Consultants",
                "Coachs sportifs",
              ].map((s, i) => (
                <span
                  key={i}
                  className="text-[12px] font-medium"
                  style={{ color: "#F5F5F7" }}
                >
                  {s}
                  <span style={{ color: "#404048", marginLeft: 16 }}>·</span>
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
