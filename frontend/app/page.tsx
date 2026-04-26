"use client";

import { motion, type Variants } from "framer-motion";
import {
  FiArrowRight,
  FiBarChart2,
  FiCpu,
  FiCheckCircle,
  FiDollarSign,
  FiLayers,
  FiTrendingUp,
} from "react-icons/fi";

const FEATURES = [
  {
    title: "AI Insights",
    description: "Instant alerts and summaries that help your team prioritize what matters first.",
    icon: FiCpu,
  },
  {
    title: "Demand Forecasting",
    description: "Predict demand changes early to reduce stockouts and over-ordering.",
    icon: FiTrendingUp,
  },
  {
    title: "Cash Flow Prediction",
    description: "Track upcoming cash trends so finance decisions stay proactive.",
    icon: FiDollarSign,
  },
  {
    title: "Smart Recommendations",
    description: "Get simple next actions based on data from inventory, finance, and sales.",
    icon: FiLayers,
  },
];

const STEPS = [
  {
    title: "Connect your data",
    description: "Bring your business data into one dashboard view.",
  },
  {
    title: "AI analyzes patterns",
    description: "Corelytics scans trends and risk signals in real time.",
  },
  {
    title: "Get actionable decisions",
    description: "Receive practical recommendations your team can execute quickly.",
  },
];

const cardClass =
  "bg-white p-6 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl";

const sectionIntroVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        <p className="text-lg font-bold text-slate-900">Corelytics</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50"
        >
          Login
        </motion.button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pt-14 pb-6 md:px-10 lg:grid-cols-2 lg:gap-16">
      <motion.div initial="hidden" animate="visible" variants={sectionIntroVariants}>
        <h1 className="text-4xl leading-tight font-bold text-slate-900 md:text-5xl">
          Corelytics - Your AI Business Brain 🧠
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Make smarter business decisions with AI-driven insights across inventory, finance, and sales.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          Get Started <FiArrowRight />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        className="relative"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative rounded-3xl border border-white/60 bg-white p-6 shadow-2xl"
          style={{ transform: "perspective(1100px) rotateX(6deg) rotateY(-7deg)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600">Live AI Dashboard</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <FiCheckCircle /> Online
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Inventory Risk</p>
              <p className="mt-1 text-lg font-bold text-slate-900">Medium</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Cash Forecast</p>
              <p className="mt-1 text-lg font-bold text-slate-900">+$58,224 in 10 days</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Top Signal</p>
              <p className="mt-1 text-lg font-bold text-slate-900">Prioritize 3 high-probability deals</p>
            </div>
          </div>
        </motion.div>

        <div className="pointer-events-none absolute -right-6 -bottom-8 -z-10 h-40 w-40 rounded-full bg-purple-200/60 blur-2xl" />
        <div className="pointer-events-none absolute -top-8 -left-8 -z-10 h-36 w-36 rounded-full bg-blue-200/60 blur-2xl" />
      </motion.div>
    </section>
  );
}

function Features() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionIntroVariants}>
        <h2 className="text-3xl font-bold text-slate-900">Powerful features for modern teams</h2>
        <p className="mt-2 text-base text-slate-600">Everything you need to run a smarter AI business dashboard.</p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div key={feature.title} variants={staggerItem} className={cardClass}>
              <div className="inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 text-white shadow-lg">
                <Icon size={19} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionIntroVariants}>
        <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
        <p className="mt-2 text-base text-slate-600">Simple setup, fast insights, and practical decisions.</p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="mt-6 grid gap-5 md:grid-cols-3"
      >
        {STEPS.map((step, index) => (
          <motion.div key={step.title} variants={staggerItem} className={cardClass}>
            <p className="text-sm font-semibold text-blue-600">Step {index + 1}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-8 pb-16 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-lg md:p-10"
      >
        <h2 className="text-3xl font-bold md:text-4xl">Start making smarter decisions today</h2>
        <p className="mt-3 max-w-2xl text-base text-blue-100">
          Launch Corelytics in minutes and give your team instant AI-powered business clarity.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-blue-700 transition-all duration-300 hover:bg-blue-50"
        >
          Get Started Free <FiBarChart2 />
        </motion.button>
      </motion.div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 text-slate-900">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ClosingCTA />
    </main>
  );
}
