"use client";

import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiCpu,
  FiCheckCircle,
  FiDollarSign,
  FiLayers,
  FiShield,
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

const HERO_BULLETS = [
  "Spot inventory risks before stockouts happen",
  "Predict cash pressure before it hurts operations",
  "Prioritize the highest-value sales opportunities first",
];

const PROBLEMS = [
  "Teams react too late to demand and inventory shifts",
  "Cash flow visibility is unclear across upcoming weeks",
  "Sales teams spend time on low-probability deals",
];

const SOLUTIONS = [
  "Corelytics flags inventory and demand risks early",
  "AI cash forecasting gives clear short-term visibility",
  "Opportunity scoring highlights where revenue is most likely",
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

function Navbar({ onLogin }: { onLogin: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        <p className="text-lg font-bold text-slate-900">Corelytics</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={onLogin}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50"
        >
          Login
        </motion.button>
      </div>
    </header>
  );
}

function Hero({ onStartFree }: { onStartFree: () => void }) {
  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pt-14 pb-6 md:px-10 lg:grid-cols-2 lg:gap-16">
      <motion.div initial="hidden" animate="visible" variants={sectionIntroVariants}>
        <h1 className="text-4xl leading-tight font-bold text-slate-900 md:text-5xl lg:text-6xl">
          Stop guessing. Let AI drive smarter business decisions.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Corelytics helps operations, finance, and sales teams act faster with clear, AI-driven priorities.
        </p>

        <ul className="mt-6 space-y-3">
          {HERO_BULLETS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-base text-slate-700">
              <span className="mt-1 inline-flex rounded-full bg-blue-100 p-1 text-blue-700">
                <FiCheck size={14} />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={onStartFree}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              Start Free <FiArrowRight />
          </motion.button>
          <p className="text-sm font-semibold text-slate-600">No setup required</p>
        </div>
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

function ProblemSolution() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionIntroVariants}>
        <h2 className="text-3xl font-bold text-slate-900">From daily chaos to clear decisions</h2>
        <p className="mt-2 max-w-3xl text-base text-slate-600">
          Most teams lose time finding what to do next. Corelytics turns complex business data into clear action.
        </p>
      </motion.div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={cardClass}
        >
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
            <FiAlertCircle className="text-red-500" /> Common Problems
          </h3>
          <ul className="space-y-3 text-sm leading-6 text-slate-600">
            {PROBLEMS.map((problem) => (
              <li key={problem} className="rounded-xl bg-red-50 px-3 py-2">
                {problem}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
          className={cardClass}
        >
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
            <FiShield className="text-emerald-600" /> Corelytics Solution
          </h3>
          <ul className="space-y-3 text-sm leading-6 text-slate-600">
            {SOLUTIONS.map((solution) => (
              <li key={solution} className="rounded-xl bg-emerald-50 px-3 py-2">
                {solution}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10" id="preview">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionIntroVariants}>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard preview</h2>
        <p className="mt-2 text-base text-slate-600">
          One view for AI insights, demand forecast, and cash flow confidence.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-md"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">AI Alert Stream</p>
            <p className="mt-2 text-base font-semibold text-slate-900">2 inventory warnings</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Demand Forecast</p>
            <p className="mt-2 text-base font-semibold text-slate-900">+12% next 7 days</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Cash Projection</p>
            <p className="mt-2 text-base font-semibold text-slate-900">Stable and positive</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          This is the decision layer your team sees every day: what is risky, what is improving, and what to do next.
        </p>
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

function ClosingCTA({ onStartFree }: { onStartFree: () => void }) {
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
        <p className="mt-3 text-sm font-semibold text-blue-100">No setup required. Start in under 2 minutes.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStartFree}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-blue-700 shadow-lg transition-all duration-300 hover:bg-blue-50"
          >
            Start Free <FiBarChart2 />
        </motion.button>
      </motion.div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();

  function goToLogin() {
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 text-slate-900">
      <Navbar onLogin={goToLogin} />
      <Hero onStartFree={goToLogin} />
      <ProblemSolution />
      <DashboardPreview />
      <Features />
      <HowItWorks />
      <ClosingCTA onStartFree={goToLogin} />
    </main>
  );
}
