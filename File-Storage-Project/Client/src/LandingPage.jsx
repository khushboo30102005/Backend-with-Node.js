
import { Link } from "react-router";
import { motion } from "motion/react";

const floatingFiles = [
  {
    name: "Resume.pdf",
    icon: "📄",
    className: "left-0 top-20",
    delay: 0,
  },
  {
    name: "Project.zip",
    icon: "📦",
    className: "right-0 top-8",
    delay: 0.8,
  },
  {
    name: "Design.png",
    icon: "🖼️",
    className: "right-8 bottom-10",
    delay: 1.5,
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fafbff] text-slate-900">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative isolate">
          {/* Animated background */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <motion.div
              className="absolute left-[10%] top-20 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl"
              animate={{
                x: [0, 80, 0],
                y: [0, 40, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className="absolute right-[5%] top-32 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl"
              animate={{
                x: [0, -70, 0],
                y: [0, 60, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent_80%)]" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:py-32">
            {/* HERO TEXT */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur"
              >
                <motion.span
                  className="h-2 w-2 rounded-full bg-indigo-600"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />

                Smarter file management
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
              >
                Your files.
                <br />

                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                  Smarter.
                </span>

                <br />

                <span className="text-slate-800">More organized.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-7 max-w-xl text-lg leading-8 text-slate-600"
              >
                Store, organize and manage your files in a secure workspace
                designed to keep everything simple, accessible and organized.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-9 flex flex-wrap gap-4"
              >
                <Link
                  to="/register"
                  className="group relative overflow-hidden rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-xl shadow-indigo-200 transition hover:-translate-y-1 hover:bg-indigo-700"
                >
                  <span className="relative z-10">Get Started →</span>

                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 group-hover:translate-x-full" />
                </Link>

                <a
                  href="#features"
                  className="rounded-xl border border-slate-300 bg-white/80 px-7 py-3.5 font-semibold text-slate-700 backdrop-blur transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-white"
                >
                  Explore Features
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="mt-8 flex flex-wrap gap-6 text-sm text-slate-500"
              >
                <span>✓ Secure</span>
                <span>✓ Simple</span>
                <span>✓ Organized</span>
              </motion.div>
            </div>

            {/* PRODUCT PREVIEW */}
            <ProductPreview />
          </div>
        </section>

        <Features />

        <HowItWorks />

        <Security />

        <CTA />
      </main>

      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* NAVBAR */
/* -------------------------------------------------------------------------- */

function Navbar() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="group text-2xl font-bold tracking-tight"
        >
          Storage<span className="text-indigo-600">App</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="nav-link">
            Features
          </a>

          <a href="#security" className="nav-link">
            Security
          </a>

          <a href="#how-it-works" className="nav-link">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

/* -------------------------------------------------------------------------- */
/* PRODUCT PREVIEW */
/* -------------------------------------------------------------------------- */

function ProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 40 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.2 }}
      className="relative mx-auto w-full max-w-xl"
    >
      {/* Glow */}
      <div className="absolute -inset-10 rounded-full bg-indigo-400/20 blur-3xl" />

      {/* Floating files */}
      {floatingFiles.map((file) => (
        <motion.div
          key={file.name}
          className={`absolute z-20 hidden rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur md:block ${file.className}`}
          animate={{
            y: [0, -12, 0],
            rotate: [0, 1.5, 0],
          }}
          transition={{
            duration: 4,
            delay: file.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{file.icon}</span>

            <div>
              <p className="text-xs font-semibold text-slate-700">
                {file.name}
              </p>

              <p className="text-[10px] text-slate-400">
                Recently updated
              </p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Main application card */}
      <motion.div
        whileHover={{
          rotateX: 2,
          rotateY: -2,
          scale: 1.015,
        }}
        transition={{ duration: 0.3 }}
        className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-100/80"
      >
        {/* Window header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          </div>

          <div className="h-8 w-52 rounded-lg bg-slate-100" />

          <div className="h-8 w-8 rounded-full bg-indigo-100" />
        </div>

        <div className="grid grid-cols-[135px_1fr] gap-5 pt-5">
          {/* Sidebar */}
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600" />
              <div className="h-3 w-14 rounded bg-slate-200" />
            </div>

            {["Dashboard", "My Files", "Recent", "Favorites"].map(
              (item, index) => (
                <motion.div
                  key={item}
                  whileHover={{ x: 3 }}
                  className={`mb-1 rounded-lg px-3 py-2 text-[10px] font-medium ${
                    index === 1
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-400"
                  }`}
                >
                  {item}
                </motion.div>
              )
            )}
          </div>

          {/* Main */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="h-5 w-28 rounded bg-slate-200" />
                <div className="mt-2 h-2.5 w-20 rounded bg-slate-100" />
              </div>

              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-[9px] font-semibold text-white"
              >
                + Upload
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["📁", "Projects"],
                ["📁", "Documents"],
                ["📄", "Resume.pdf"],
                ["🖼️", "Design.png"],
              ].map(([icon, name]) => (
                <motion.div
                  key={name}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="text-xl">{icon}</div>

                  <div className="mt-3 text-[10px] font-semibold text-slate-700">
                    {name}
                  </div>

                  <div className="mt-1 text-[8px] text-slate-400">
                    Recently updated
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Storage */}
            <div className="mt-4 rounded-xl bg-indigo-50 p-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-semibold text-slate-600">
                  Storage
                </span>

                <span className="text-[10px] font-bold text-indigo-600">
                  62%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "62%" }}
                  transition={{ duration: 1.5, delay: 0.8 }}
                  className="h-full rounded-full bg-indigo-600"
                />
              </div>

              <p className="mt-2 text-[8px] text-slate-400">
                6.2 GB of 10 GB used
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload notification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: [0, -8, 0],
        }}
        transition={{
          opacity: { delay: 1, duration: 0.5 },
          y: { delay: 1.5, duration: 4, repeat: Infinity },
        }}
        className="absolute -bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-sm">
            ✓
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700">
              Upload complete
            </p>

            <p className="text-[10px] text-slate-400">
              Project.zip • 24 MB
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* FEATURES */
/* -------------------------------------------------------------------------- */

function Features() {
  const features = [
    {
      icon: "🔐",
      title: "Secure",
      text: "Authentication and controlled access keep your workspace protected.",
    },
    {
      icon: "✨",
      title: "Smart",
      text: "Designed to make organizing and finding your files easier.",
    },
    {
      icon: "⚡",
      title: "Fast",
      text: "Upload, browse and manage your files through a clean interface.",
    },
  ];

  return (
    <section id="features" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Features
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything in one workspace
            </h2>

            <p className="mt-4 text-slate-500">
              Simple tools designed around the way you manage files.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.12}>
              <motion.div
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
                className="group h-full rounded-3xl border border-slate-200 bg-slate-50 p-8 transition-shadow hover:shadow-xl hover:shadow-indigo-100"
              >
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-xl"
                >
                  {feature.icon}
                </motion.div>

                <h3 className="mt-6 text-xl font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-500">
                  {feature.text}
                </p>

                <div className="mt-6 text-sm font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100">
                  Explore →
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* HOW IT WORKS */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#fafbff]">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                How it works
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Less clutter.
                <br />
                More control.
              </h2>

              <p className="mt-5 max-w-lg leading-7 text-slate-500">
                Upload your files, organize them into folders and manage
                everything from one clean workspace.
              </p>
            </div>

            <div className="space-y-4">
              {[
                ["01", "Upload", "Add your files to your workspace."],
                ["02", "Organize", "Create folders and structure your files."],
                ["03", "Manage", "Find and manage everything when you need it."],
              ].map(([number, title, text], index) => (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ x: 6 }}
                  className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="font-mono text-sm font-bold text-indigo-600">
                    {number}
                  </span>

                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECURITY */
/* -------------------------------------------------------------------------- */

function Security() {
  return (
    <section id="security" className="relative overflow-hidden bg-slate-950 text-white">
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <Reveal>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                Security
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Built with security in mind.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-slate-400">
                StorageApp is designed around authentication, access control
                and secure file management.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4">
            {[
              "Authentication",
              "Access Control",
              "Secure Storage",
              "Privacy Focused",
            ].map((item, index) => (
              <Reveal key={item} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 2,
                      delay: index * 0.3,
                      repeat: Infinity,
                    }}
                    className="mb-5 h-2 w-2 rounded-full bg-indigo-400"
                  />

                  <p className="text-sm font-medium">{item}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* CTA */
/* -------------------------------------------------------------------------- */

function CTA() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <Reveal>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to organize your files?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
            Build a cleaner, simpler workspace for everything you create.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="mt-9 inline-block"
          >
            <Link
              to="/register"
              className="inline-block rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-xl shadow-indigo-200"
            >
              Get Started →
            </Link>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FOOTER */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} StorageApp
        </span>

        <div className="flex gap-5">
          <a href="#features" className="hover:text-slate-900">
            Features
          </a>

          <a href="#security" className="hover:text-slate-900">
            Security
          </a>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* REVEAL */
/* -------------------------------------------------------------------------- */

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export default LandingPage;
