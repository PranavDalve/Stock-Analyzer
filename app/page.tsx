'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { TrendingUp, BarChart3, Shield, Zap, Globe, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500 selection:text-white overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-black w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">MarketPulse AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#" className="hover:text-white transition-colors">Platform</a>
          <a href="#" className="hover:text-white transition-colors">Resources</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>

          <button
            onClick={goToDashboard}
            className="px-5 py-2 bg-white text-black rounded-full hover:bg-orange-500 transition-all duration-300 font-semibold"
          >
            Launch Dashboard
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-32">

        {/* Ticker */}
        <div className="flex overflow-hidden mb-16 border-y border-white/5 py-4 whitespace-nowrap">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 text-xs font-mono"
          >
            {[1, 2].map((i) => (
              <React.Fragment key={i}>
                <span>AAPL <span className="text-emerald-400">+1.24%</span></span>
                <span>TSLA <span className="text-rose-400">-0.82%</span></span>
                <span>NVDA <span className="text-emerald-400">+4.15%</span></span>
                <span>BTC <span className="text-emerald-400">+0.44%</span></span>
                <span>MSFT <span className="text-rose-400">-0.12%</span></span>
                <span>AMZN <span className="text-emerald-400">+1.05%</span></span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-orange-400 mb-6 uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              Powered by Next-Gen Analytics
            </div>

            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter mb-8 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
              Precision <br /> at Scale.
            </h1>

            <p className="text-lg md:text-xl text-white/50 mb-10 max-w-lg">
              Real-time insights, institutional-grade data, and AI-driven predictive modeling.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={goToDashboard}
                className="group flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-full font-bold text-lg hover:bg-orange-500 transition-all duration-500"
              >
                Launch App
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-10 py-5 rounded-full font-bold text-lg hover:bg-white/10">
                View Docs
              </button>
            </div>
          </motion.div>

          {/* Right Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-[500px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-blue-500/20 rounded-3xl blur-3xl" />

              <div className="relative h-full w-full bg-[#111] rounded-3xl border border-white/10 p-6 shadow-2xl">
                <div className="space-y-6">

                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-white/40">TOTAL EQUITY</p>
                      <h3 className="text-3xl font-bold">$1,429,204</h3>
                      <p className="text-xs text-emerald-400">+1.8% Today</p>
                    </div>
                    <BarChart3 className="text-orange-500" />
                  </div>

                  <div className="h-48 flex items-end gap-2">
                    {[40,70,45,90,65,80,55,95].map((h,i)=>(
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i*0.05 }}
                        className="flex-1 bg-orange-500 rounded-t"
                      />
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Features */}
        <section className="mt-40 grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: "Secure", desc: "Encrypted data" },
            { icon: Globe, title: "Global", desc: "50+ exchanges" },
            { icon: BarChart3, title: "Analysis", desc: "Advanced charts" }
          ].map((f,i)=>(
            <motion.div key={i} whileHover={{ y:-5 }}
              className="p-8 bg-white/5 rounded-2xl border border-white/5">
              <f.icon className="text-orange-500 mb-4"/>
              <h4 className="text-xl font-bold">{f.title}</h4>
              <p className="text-white/50 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-white/30 text-xs">
        © 2026 MARKETPULSE
      </footer>

    </div>
  )
}