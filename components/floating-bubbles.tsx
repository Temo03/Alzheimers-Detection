"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function Bubble({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={size}
      fill={color}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.7, 0.3, 0.7],
        scale: [1, 1.2, 1],
        x: x + Math.random() * 100 - 50,
        y: y + Math.random() * 100 - 50,
      }}
      transition={{
        duration: 5 + Math.random() * 10,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
    />
  )
}

function FloatingBubbles() {
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string }>>([])

  useEffect(() => {
    const newBubbles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 20 + 5,
      color: `rgba(${45 + Math.random() * 30},${150 + Math.random() * 50},${180 + Math.random() * 50},0.3)`,
    }))
    setBubbles(newBubbles)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <title>Floating Bubbles</title>
        {bubbles.map((bubble) => (
          <Bubble key={bubble.id} {...bubble} />
        ))}
      </svg>
    </div>
  )
}

export default function FloatingBubblesBackground({
  title = "Alzheimer's Decision Support System",
}: {
  title?: string
}) {
  const words = title.split(" ")

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 to-blue-100 dark:from-teal-950 dark:to-blue-950">
      <FloatingBubbles />

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text 
                               bg-gradient-to-r from-teal-600 to-blue-600 
                               dark:from-teal-300 dark:to-blue-300"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
            Advanced neural analysis for early detection and monitoring of cognitive health
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
            <div
              className="group relative bg-gradient-to-b from-teal-400/30 to-blue-400/30 
                         dark:from-teal-600/30 dark:to-blue-600/30 p-px rounded-2xl backdrop-blur-lg 
                         overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <Link href="/dashboard/doctor">
                <Button
                  variant="ghost"
                  className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                             bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90 
                             text-teal-600 dark:text-teal-300 transition-all duration-300 
                             group-hover:-translate-y-0.5 border border-teal-200/50 dark:border-teal-700/50
                             hover:shadow-md dark:hover:shadow-teal-900/30 w-full sm:w-auto"
                >
                  <span className="opacity-90 group-hover:opacity-100 transition-opacity">Doctor Dashboard</span>
                  <span
                    className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                               transition-all duration-300"
                  >
                    →
                  </span>
                </Button>
              </Link>
            </div>

            <div
              className="group relative bg-gradient-to-b from-blue-400/30 to-indigo-400/30 
                         dark:from-blue-600/30 dark:to-indigo-600/30 p-px rounded-2xl backdrop-blur-lg 
                         overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <Link href="/dashboard/patient">
                <Button
                  variant="ghost"
                  className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                             bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90 
                             text-blue-600 dark:text-blue-300 transition-all duration-300 
                             group-hover:-translate-y-0.5 border border-blue-200/50 dark:border-blue-700/50
                             hover:shadow-md dark:hover:shadow-blue-900/30 w-full sm:w-auto"
                >
                  <span className="opacity-90 group-hover:opacity-100 transition-opacity">Patient Dashboard</span>
                  <span
                    className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                               transition-all duration-300"
                  >
                    →
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

