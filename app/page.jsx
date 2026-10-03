"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const modules = [
  {
    title: "Current Affairs",
    subtitle: "Daily • Monthly • MCQs",
    icon: "📰",
    route: "/current-affairs",
  },
  {
    title: "PYQ Intelligence",
    subtitle: "2013–2026 • Topic Wise",
    icon: "🎯",
    route: "/pyq",
  },
  {
    title: "Prelims Practice",
    subtitle: "Practice • Revision • Tests",
    icon: "📝",
    route: null,
  },
  {
    title: "Mock Tests",
    subtitle: "Full Length • Sectional • CSAT",
    icon: "⏱",
    route: null,
  },
  {
    title: "Mains Answer",
    subtitle: "GS I • II • III • IV",
    icon: "✍️",
    route: "/answer",
  },
  {
    title: "AI Evaluation",
    subtitle: "Answer Analysis • Improvement",
    icon: "🤖",
    route: null,
  },
  {
    title: "Study Material",
    subtitle: "Notes • PDFs • Revision",
    icon: "📚",
    route: null,
  },
  {
    title: "My Analytics",
    subtitle: "Accuracy • Progress • Streak",
    icon: "📊",
    route: null,
  },
];

function formatDate(date) {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getRemainingDays(date) {
  if (!date) return 0;

  const diff = new Date(date).getTime() - Date.now();

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [welcome, setWelcome] = useState(true);
  const [activeView, setActiveView] = useState("home");

  const [telegramMode, setTelegramMode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();

    const timer = setTimeout(() => {
      setWelcome(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  async function loadUser() {
    try {
      setLoading(true);
      setError("");

      // -----------------------------------------
      // 1. Normal website/email session
      // -----------------------------------------
      const emailResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const emailData = await emailResponse.json().catch(() => ({}));

      if (emailResponse.ok && emailData?.user) {
        setUser(emailData.user);
        setSubscription(emailData.subscription || null);
        setIsAdmin(Boolean(emailData.isAdmin));
        setTelegramMode(false);
        setLoading(false);
        return;
      }

      // -----------------------------------------
      // 2. Telegram fallback
      // -----------------------------------------
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;

        try {
          webApp.ready();
          webApp.expand();
        } catch {}

        const initData = webApp.initData;

        if (initData) {
          const telegramResponse = await fetch("/api/auth/me", {
            method: "GET",
            headers: {
              Authorization: `tma ${initData}`,
            },
            cache: "no-store",
          });

          const telegramData = await telegramResponse
            .json()
            .catch(() => ({}));

          if (telegramResponse.ok && telegramData?.user) {
            setUser(telegramData.user);
            setSubscription(telegramData.subscription || null);
            setIsAdmin(Boolean(telegramData.isAdmin));
            setTelegramMode(true);
            setLoading(false);
            return;
          }
        }
      }

      // -----------------------------------------
      // No authentication
      // -----------------------------------------
      setUser(null);
      setSubscription(null);
      setIsAdmin(false);
    } catch (err) {
      console.error("Home auth error:", err);
      setError("Authentication check failed.");
    } finally {
      setLoading(false);
    }
  }

  const activeSubscription = useMemo(() => {
    if (!subscription) return null;

    const isActive =
      subscription.status === "active" &&
      subscription.expires_at &&
      new Date(subscription.expires_at) > new Date();

    return isActive ? subscription : null;
  }, [subscription]);

  const isPremium = Boolean(activeSubscription);

  const isDemo =
    isPremium &&
    String(activeSubscription?.plan || "").toLowerCase() === "demo";

  const remainingDays = getRemainingDays(activeSubscription?.expires_at);

  function openModule(item) {
    if (!isPremium) {
      router.push("/premium");
      return;
    }

    if (item.route) {
      router.push(item.route);
      return;
    }

    // Existing module route can be connected here later.
    router.push("/premium");
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    router.replace("/login");
  }

  if (loading || welcome) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingLogo}>S</div>

        <div style={styles.loadingTitle}>SAMBHAV</div>

        <div style={styles.loadingSubtitle}>
          UPSC Preparation Platform
        </div>

        <div style={styles.loader} />
      </main>
    );
  }

  // ------------------------------------------------
  // PUBLIC LANDING
  // ------------------------------------------------
  if (!user) {
    return (
      <main style={styles.publicPage}>
        <header style={styles.publicHeader}>
          <div style={styles.brand}>
            <div style={styles.brandMark}>S</div>

            <div>
              <div style={styles.brandName}>SAMBHAV UPSC</div>
              <div style={styles.brandSmall}>
                Intelligent Preparation System
              </div>
            </div>
          </div>

          <button
            style={styles.loginTopButton}
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroBadge}>UPSC PREPARATION PLATFORM</div>

          <h1 style={styles.heroTitle}>
            Your Complete
            <br />
            <span>UPSC Preparation</span>
            <br />
            Platform.
          </h1>

          <p style={styles.heroText}>
            Current Affairs, PYQs, Prelims Practice, Mains Answer
            Writing, AI Evaluation and Study Material — organised in
            one intelligent preparation system.
          </p>

          <div style={styles.heroButtons}>
            <button
              style={styles.primaryButton}
              onClick={() => router.push("/login")}
            >
              Start Preparation
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => router.push("/premium")}
            >
              Explore Premium
            </button>
          </div>
        </section>

        <section style={styles.featureSection}>
          <div style={styles.sectionLabel}>THE SAMBHAV SYSTEM</div>

          <h2 style={styles.sectionTitle}>
            Everything you need for UPSC.
          </h2>

          <div style={styles.featureGrid}>
            {modules.slice(0, 6).map((item) => (
              <div key={item.title} style={styles.featureCard}>
                <div style={styles.featureIcon}>{item.icon}</div>

                <div style={styles.featureTitle}>{item.title}</div>

                <div style={styles.featureSubtitle}>
                  {item.subtitle}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.pricingSection}>
          <div style={styles.sectionLabel}>PREMIUM ACCESS</div>

          <h2 style={styles.sectionTitle}>
            Choose your preparation access.
          </h2>

          <div style={styles.pricingGrid}>
            <PriceCard
              title="2-Day Demo"
              price="₹0"
              duration="2 Days"
              button="Start Free Demo"
              onClick={() => router.push("/login")}
            />

            <PriceCard
              title="Monthly"
              price="₹99"
              duration="1 Month"
              button="Get Premium"
              featured
              onClick={() => router.push("/premium")}
            />

            <PriceCard
              title="Quarterly"
              price="₹399"
              duration="3 Months"
              button="Get Premium"
              onClick={() => router.push("/premium")}
            />

            <PriceCard
              title="Annual"
              price="₹999"
              duration="12 Months"
              button="Get Premium"
              onClick={() => router.push("/premium")}
            />
          </div>
        </section>

        <footer style={styles.footer}>
          <div>SAMBHAV UPSC</div>
          <div>Focused preparation. Better revision. Smarter practice.</div>
        </footer>
      </main>
    );
  }

  // ------------------------------------------------
  // ACCOUNT STATUS
  // ------------------------------------------------
  if (user.status && user.status !== "approved") {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.statusCard}>
          <div style={styles.loadingLogo}>S</div>

          <h2 style={styles.statusTitle}>
            Account {String(user.status).toUpperCase()}
          </h2>

          <p style={styles.statusText}>
            Your SAMBHAV account is currently marked as{" "}
            <strong>{user.status}</strong>.
          </p>

          <button
            style={styles.primaryButton}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  // ------------------------------------------------
  // MAIN SAMBHAV DASHBOARD
  // MASTER UI = PREMIUM HOME
  // ------------------------------------------------
  return (
    <main style={styles.app}>
      <header style={styles.topBar}>
        <div>
          <div style={styles.topBrand}>SAMBHAV</div>
          <div style={styles.topSub}>UPSC PREPARATION SYSTEM</div>
        </div>

        <button
          style={styles.profileButton}
          onClick={() => setActiveView("profile")}
        >
          {(user.name || user.email || "U")
            .charAt(0)
            .toUpperCase()}
        </button>
      </header>

      {activeView === "profile" ? (
        <ProfileView
          user={user}
          subscription={activeSubscription}
          isAdmin={isAdmin}
          isPremium={isPremium}
          onLogout={logout}
          onBack={() => setActiveView("home")}
        />
      ) : (
        <>
          <section style={styles.greeting}>
            <div style={styles.eyebrow}>WELCOME BACK</div>

            <h1 style={styles.greetingTitle}>
              {user.name
                ? `Hello, ${user.name.split(" ")[0]}`
                : "Welcome to SAMBHAV"}
            </h1>

            <p style={styles.greetingText}>
              Continue your UPSC preparation with clarity.
            </p>
          </section>

          {/* ACCESS CARD — SAME PREMIUM HOME STRUCTURE */}
          <section
            style={{
              ...styles.premiumCard,
              ...(isPremium
                ? styles.premiumCardActive
                : styles.premiumCardFree),
            }}
          >
            <div style={styles.premiumTop}>
              <div style={styles.premiumLabel}>
                {isPremium
                  ? "✦ PREMIUM ACCESS"
                  : "SAMBHAV ACCESS"}
              </div>

              <div style={styles.premiumBadge}>
                {isPremium
                  ? isDemo
                    ? "DEMO"
                    : "PREMIUM"
                  : "FREE"}
              </div>
            </div>

            <h2 style={styles.premiumTitle}>
              {isPremium
                ? isDemo
                  ? "Demo Access Active"
                  : "Officer Access Active"
                : "Preparation Access"}
            </h2>

            <p style={styles.premiumText}>
              {isPremium
                ? isDemo
                  ? "Your 2-Day Premium Demo is currently active."
                  : "Your Premium learning environment is active."
                : "Your UPSC preparation workspace is ready."}
            </p>

            <div style={styles.premiumBottom}>
              <div style={styles.premiumStatus}>
                {isPremium
                  ? isDemo
                    ? `✓ DEMO ACTIVE • UNTIL ${formatDate(
                        activeSubscription?.expires_at
                      )}`
                    : `✓ PREMIUM ACTIVE • UNTIL ${formatDate(
                        activeSubscription?.expires_at
                      )}`
                  : "FREE ACCESS"}
              </div>

              {!isPremium && (
                <button
                  style={styles.upgradeButton}
                  onClick={() => router.push("/premium")}
                >
                  Upgrade
                </button>
              )}
            </div>
          </section>

          {/* STATS */}
          <section style={styles.statsGrid}>
            <StatCard title="Current Affairs" value="0" label="Read" />
            <StatCard title="PYQs" value="0" label="Solved" />
            <StatCard title="Accuracy" value="0%" label="Overall" />
          </section>

          {/* MODULES */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <div style={styles.sectionLabelSmall}>YOUR SYSTEM</div>
                <h2 style={styles.sectionHeading}>
                  Preparation Modules
                </h2>
              </div>
            </div>

            <div style={styles.modulesGrid}>
              {modules.map((item) => (
                <button
                  key={item.title}
                  style={{
                    ...styles.moduleCard,
                    ...(isPremium
                      ? {}
                      : styles.moduleCardLocked),
                  }}
                  onClick={() => openModule(item)}
                >
                  <div style={styles.moduleIcon}>{item.icon}</div>

                  <div style={styles.moduleContent}>
                    <div style={styles.moduleTitle}>
                      {item.title}
                    </div>

                    <div style={styles.moduleSubtitle}>
                      {item.subtitle}
                    </div>
                  </div>

                  <div style={styles.moduleArrow}>
                    {isPremium ? "→" : "🔒"}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* TODAY'S MISSION */}
          <section style={styles.section}>
            <div style={styles.sectionLabelSmall}>
              TODAY'S MISSION
            </div>

            <h2 style={styles.sectionHeading}>
              Build your preparation streak.
            </h2>

            <div style={styles.missionCard}>
              <MissionRow
                title="Current Affairs"
                progress={35}
                value="35%"
              />

              <MissionRow
                title="PYQ Practice"
                progress={20}
                value="20%"
              />

              <MissionRow
                title="Mains Answer"
                progress={10}
                value="10%"
              />
            </div>
          </section>

          {/* DAILY INTELLIGENCE */}
          <section style={styles.intelligence}>
            <div style={styles.intelligenceLabel}>
              DAILY INTELLIGENCE
            </div>

            <h2 style={styles.intelligenceTitle}>
              Revise. Practice. Analyse.
            </h2>

            <p style={styles.intelligenceText}>
              SAMBHAV brings your daily UPSC preparation into one
              focused workspace.
            </p>

            <button
              style={styles.intelligenceButton}
              onClick={() =>
                isPremium
                  ? router.push("/current-affairs")
                  : router.push("/premium")
              }
            >
              {isPremium ? "Continue Preparation →" : "Unlock Premium →"}
            </button>
          </section>

          {/* AI INSIGHT */}
          <section style={styles.aiCard}>
            <div style={styles.aiIcon}>✦</div>

            <div>
              <div style={styles.aiLabel}>AI INSIGHT</div>

              <h3 style={styles.aiTitle}>
                Your preparation will become stronger
                through consistent revision.
              </h3>

              <p style={styles.aiText}>
                Focus on accuracy first, then increase your
                question-solving speed.
              </p>
            </div>
          </section>

          {/* ADMIN */}
          {isAdmin && (
            <section style={styles.adminCard}>
              <div>
                <div style={styles.adminLabel}>ADMIN ACCESS</div>
                <div style={styles.adminTitle}>
                  SAMBHAV Administration
                </div>
              </div>

              <button
                style={styles.adminButton}
                onClick={() => router.push("/admin")}
              >
                Open Admin →
              </button>
            </section>
          )}
        </>
      )}

      {/* BOTTOM NAV */}
      <nav style={styles.bottomNav}>
        <NavItem
          icon="⌂"
          label="Home"
          active={activeView === "home"}
          onClick={() => setActiveView("home")}
        />

        <NavItem
          icon="✓"
          label="Practice"
          active={activeView === "practice"}
          onClick={() => {
            if (!isPremium) {
              router.push("/premium");
            } else {
              setActiveView("practice");
            }
          }}
        />

        <NavItem
          icon="📰"
          label="Current"
          active={activeView === "current"}
          onClick={() => {
            if (!isPremium) {
              router.push("/premium");
            } else {
              router.push("/current-affairs");
            }
          }}
        />

        <NavItem
          icon="✦"
          label="AI"
          active={activeView === "ai"}
          onClick={() => {
            if (!isPremium) {
              router.push("/premium");
            } else {
              setActiveView("ai");
            }
          }}
        />

        <NavItem
          icon="○"
          label="Profile"
          active={activeView === "profile"}
          onClick={() => setActiveView("profile")}
        />
      </nav>

      {error && (
        <div style={styles.errorToast}>
          {error}
        </div>
      )}
    </main>
  );
}

function PriceCard({
  title,
  price,
  duration,
  button,
  featured,
  onClick,
}) {
  return (
    <div
      style={{
        ...styles.priceCard,
        ...(featured ? styles.priceCardFeatured : {}),
      }}
    >
      {featured && (
        <div style={styles.featuredBadge}>POPULAR</div>
      )}

      <div style={styles.priceTitle}>{title}</div>

      <div style={styles.price}>{price}</div>

      <div style={styles.priceDuration}>{duration}</div>

      <button
        style={{
          ...styles.priceButton,
          ...(featured ? styles.priceButtonFeatured : {}),
        }}
        onClick={onClick}
      >
        {button}
      </button>
    </div>
  );
}

function StatCard({ title, value, label }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTitle}>{title}</div>

      <div style={styles.statValue}>{value}</div>

      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function MissionRow({ title, progress, value }) {
  return (
    <div style={styles.missionRow}>
      <div style={styles.missionTop}>
        <span>{title}</span>
        <span>{value}</span>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressBar,
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
    >
      <span style={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ProfileView({
  user,
  subscription,
  isAdmin,
  isPremium,
  onLogout,
  onBack,
}) {
  return (
    <section style={styles.profileView}>
      <button style={styles.backButton} onClick={onBack}>
        ← Back
      </button>

      <div style={styles.profileHero}>
        <div style={styles.profileAvatar}>
          {(user.name || user.email || "U")
            .charAt(0)
            .toUpperCase()}
        </div>

        <h1 style={styles.profileName}>
          {user.name || "SAMBHAV User"}
        </h1>

        <p style={styles.profileEmail}>{user.email}</p>
      </div>

      <div style={styles.profileCard}>
        <ProfileRow
          label="Account Status"
          value={user.status || "approved"}
        />

        <ProfileRow
          label="Access"
          value={
            isPremium
              ? subscription?.plan === "demo"
                ? "Premium Demo"
                : "Premium"
              : "Free"
          }
        />

        <ProfileRow
          label="Premium Started"
          value={formatDate(subscription?.started_at)}
        />

        <ProfileRow
          label="Premium Expires"
          value={formatDate(subscription?.expires_at)}
        />

        <ProfileRow
          label="Account Created"
          value={formatDate(user.created_at)}
        />

        <ProfileRow
          label="Security"
          value="Email + Password"
        />

        {isAdmin && (
          <ProfileRow
            label="Role"
            value="Administrator"
          />
        )}
      </div>

      <button style={styles.logoutButton} onClick={onLogout}>
        Logout
      </button>
    </section>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div style={styles.profileRow}>
      <span style={styles.profileRowLabel}>{label}</span>
      <span style={styles.profileRowValue}>{value}</span>
    </div>
  );
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    background: "#f5f2eb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#101010",
    padding: 24,
  },

  loadingLogo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    background: "#101010",
    color: "#dfc477",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
    fontWeight: 900,
    marginBottom: 16,
  },

  loadingTitle: {
    fontSize: 25,
    fontWeight: 900,
    letterSpacing: 3,
  },

  loadingSubtitle: {
    marginTop: 7,
    fontSize: 12,
    color: "#777",
    letterSpacing: 1,
  },

  loader: {
    width: 24,
    height: 24,
    border: "3px solid #ddd7cb",
    borderTop: "3px solid #101010",
    borderRadius: "50%",
    marginTop: 28,
    animation: "spin 1s linear infinite",
  },

  publicPage: {
    minHeight: "100vh",
    background: "#f5f2eb",
    color: "#101010",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  publicHeader: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "24px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#101010",
    color: "#dfc477",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 21,
  },

  brandName: {
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: 1.5,
  },

  brandSmall: {
    fontSize: 9,
    color: "#888",
    marginTop: 2,
    letterSpacing: 0.7,
  },

  loginTopButton: {
    border: "1px solid #101010",
    background: "transparent",
    borderRadius: 10,
    padding: "10px 17px",
    fontWeight: 800,
    cursor: "pointer",
  },

  hero: {
    maxWidth: 1050,
    margin: "0 auto",
    padding: "80px 22px 90px",
    textAlign: "center",
  },

  heroBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2,
    background: "#dfc477",
    padding: "8px 13px",
    borderRadius: 999,
    marginBottom: 22,
  },

  heroTitle: {
    fontSize: "clamp(42px, 7vw, 82px)",
    lineHeight: 0.98,
    letterSpacing: -3,
    margin: 0,
    fontWeight: 950,
  },

  heroText: {
    maxWidth: 680,
    margin: "28px auto 0",
    color: "#666",
    fontSize: 17,
    lineHeight: 1.7,
  },

  heroButtons: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 34,
  },

  primaryButton: {
    background: "#101010",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 22px",
    fontWeight: 850,
    cursor: "pointer",
  },

  secondaryButton: {
    background: "#fffdf9",
    color: "#101010",
    border: "1px solid #ddd7cb",
    borderRadius: 12,
    padding: "14px 22px",
    fontWeight: 850,
    cursor: "pointer",
  },

  featureSection: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "60px 22px",
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2,
    color: "#a0833e",
    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: "clamp(28px, 4vw, 45px)",
    lineHeight: 1.1,
    margin: "0 0 28px",
    fontWeight: 900,
    letterSpacing: -1.3,
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 13,
  },

  featureCard: {
    background: "#fffdf9",
    border: "1px solid #e4dfd4",
    borderRadius: 17,
    padding: 20,
  },

  featureIcon: {
    fontSize: 24,
    marginBottom: 22,
  },

  featureTitle: {
    fontWeight: 900,
    fontSize: 15,
  },

  featureSubtitle: {
    color: "#777",
    fontSize: 11,
    marginTop: 6,
    lineHeight: 1.5,
  },

  pricingSection: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "70px 22px 90px",
  },

  pricingGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 15,
  },

  priceCard: {
    background: "#fffdf9",
    border: "1px solid #ded8cc",
    borderRadius: 18,
    padding: 24,
    position: "relative",
  },

  priceCardFeatured: {
    background: "#101010",
    color: "#fff",
    borderColor: "#101010",
  },

  featuredBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "#dfc477",
    color: "#101010",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 8,
    fontWeight: 900,
  },

  priceTitle: {
    fontWeight: 900,
    fontSize: 15,
  },

  price: {
    fontSize: 36,
    fontWeight: 950,
    marginTop: 18,
  },

  priceDuration: {
    color: "#888",
    fontSize: 11,
    marginTop: 5,
  },

  priceButton: {
    width: "100%",
    marginTop: 24,
    border: "1px solid #101010",
    background: "transparent",
    color: "#101010",
    borderRadius: 10,
    padding: "12px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  priceButtonFeatured: {
    background: "#dfc477",
    borderColor: "#dfc477",
  },

  footer: {
    borderTop: "1px solid #ddd7cb",
    maxWidth: 1180,
    margin: "0 auto",
    padding: "25px 22px 100px",
    display: "flex",
    justifyContent: "space-between",
    gap: 15,
    flexWrap: "wrap",
    color: "#777",
    fontSize: 11,
  },

  app: {
    minHeight: "100vh",
    background: "#f5f2eb",
    color: "#101010",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    paddingBottom: 95,
  },

  topBar: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "20px 18px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topBrand: {
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: 2,
  },

  topSub: {
    fontSize: 8,
    color: "#8b867d",
    letterSpacing: 1.4,
    marginTop: 3,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "1px solid #d7d0c2",
    background: "#fffdf9",
    color: "#101010",
    fontWeight: 900,
    cursor: "pointer",
  },

  greeting: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "22px 18px 20px",
  },

  eyebrow: {
    color: "#a0833e",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: 900,
  },

  greetingTitle: {
    margin: "7px 0 4px",
    fontSize: "clamp(27px, 5vw, 39px)",
    lineHeight: 1,
    letterSpacing: -1.2,
    fontWeight: 950,
  },

  greetingText: {
    color: "#777",
    fontSize: 12,
    margin: 0,
  },

  premiumCard: {
    maxWidth: 1064,
    margin: "0 auto 18px",
    borderRadius: 22,
    padding: 24,
    color: "#fff",
  },

  premiumCardActive: {
    background: "#101010",
  },

  premiumCardFree: {
    background: "#fffdf9",
    color: "#101010",
    border: "1px solid #ded8cc",
  },

  premiumTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  premiumLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: 900,
    color: "#dfc477",
  },

  premiumBadge: {
    fontSize: 8,
    fontWeight: 900,
    border: "1px solid rgba(223,196,119,.5)",
    color: "#dfc477",
    padding: "5px 8px",
    borderRadius: 999,
  },

  premiumTitle: {
    fontSize: 25,
    fontWeight: 950,
    margin: "22px 0 8px",
    letterSpacing: -0.7,
  },

  premiumText: {
    color: "#aaa",
    fontSize: 12,
    margin: 0,
  },

  premiumCardFreeText: {
    color: "#777",
  },

  premiumBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 23,
  },

  premiumStatus: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: 900,
    color: "#dfc477",
  },

  upgradeButton: {
    background: "#dfc477",
    color: "#101010",
    border: "none",
    borderRadius: 9,
    padding: "9px 13px",
    fontSize: 10,
    fontWeight: 900,
    cursor: "pointer",
  },

  statsGrid: {
    maxWidth: 1064,
    margin: "0 auto",
    padding: "0 0 8px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },

  statCard: {
    background: "#fffdf9",
    border: "1px solid #e1dbcf",
    borderRadius: 15,
    padding: 14,
  },

  statTitle: {
    fontSize: 9,
    fontWeight: 800,
    color: "#777",
  },

  statValue: {
    fontSize: 24,
    fontWeight: 950,
    marginTop: 9,
  },

  statLabel: {
    fontSize: 9,
    color: "#aaa",
    marginTop: 2,
  },

  section: {
    maxWidth: 1064,
    margin: "0 auto",
    padding: "20px 0 0",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
  },

  sectionLabelSmall: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.7,
    color: "#a0833e",
  },

  sectionHeading: {
    margin: "6px 0 15px",
    fontSize: 21,
    letterSpacing: -0.5,
    fontWeight: 950,
  },

  modulesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  moduleCard: {
    width: "100%",
    minHeight: 94,
    border: "1px solid #ded8cc",
    borderRadius: 17,
    background: "#fffdf9",
    padding: 15,
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "left",
    cursor: "pointer",
  },

  moduleCardLocked: {
    opacity: 0.72,
  },

  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "#f1ede5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    flexShrink: 0,
  },

  moduleContent: {
    minWidth: 0,
    flex: 1,
  },

  moduleTitle: {
    fontSize: 13,
    fontWeight: 900,
  },

  moduleSubtitle: {
    color: "#888",
    fontSize: 9,
    marginTop: 5,
    lineHeight: 1.4,
  },

  moduleArrow: {
    fontSize: 13,
    color: "#a0833e",
    flexShrink: 0,
  },

  missionCard: {
    background: "#fffdf9",
    border: "1px solid #ded8cc",
    borderRadius: 18,
    padding: 18,
  },

  missionRow: {
    marginBottom: 16,
  },

  missionRowLast: {
    marginBottom: 0,
  },

  missionTop: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    fontWeight: 800,
    marginBottom: 7,
  },

  progressTrack: {
    height: 6,
    background: "#ece7de",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "#101010",
    borderRadius: 999,
  },

  intelligence: {
    maxWidth: 1064,
    margin: "20px auto 0",
    borderRadius: 21,
    padding: 24,
    background: "#101010",
    color: "#fff",
  },

  intelligenceLabel: {
    color: "#dfc477",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.7,
  },

  intelligenceTitle: {
    fontSize: 27,
    margin: "15px 0 8px",
    fontWeight: 950,
    letterSpacing: -0.8,
  },

  intelligenceText: {
    color: "#aaa",
    fontSize: 11,
    lineHeight: 1.6,
    maxWidth: 540,
  },

  intelligenceButton: {
    marginTop: 12,
    border: "none",
    background: "#dfc477",
    color: "#101010",
    borderRadius: 9,
    padding: "10px 14px",
    fontSize: 10,
    fontWeight: 900,
    cursor: "pointer",
  },

  aiCard: {
    maxWidth: 1064,
    margin: "12px auto 0",
    background: "#fffdf9",
    border: "1px solid #ded8cc",
    borderRadius: 18,
    padding: 19,
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },

  aiIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: "#101010",
    color: "#dfc477",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  aiLabel: {
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: 1.5,
    color: "#a0833e",
  },

  aiTitle: {
    fontSize: 14,
    margin: "6px 0",
    fontWeight: 900,
  },

  aiText: {
    color: "#777",
    fontSize: 10,
    lineHeight: 1.5,
    margin: 0,
  },

  adminCard: {
    maxWidth: 1064,
    margin: "12px auto 0",
    padding: 18,
    borderRadius: 17,
    background: "#101010",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  adminLabel: {
    fontSize: 8,
    color: "#dfc477",
    fontWeight: 900,
    letterSpacing: 1.4,
  },

  adminTitle: {
    fontSize: 13,
    fontWeight: 900,
    marginTop: 4,
  },

  adminButton: {
    border: "1px solid #dfc477",
    color: "#dfc477",
    background: "transparent",
    borderRadius: 9,
    padding: "9px 12px",
    fontSize: 9,
    fontWeight: 900,
    cursor: "pointer",
  },

  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: 68,
    background: "rgba(255,253,249,.97)",
    borderTop: "1px solid #ddd7cb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 50,
    backdropFilter: "blur(12px)",
  },

  navItem: {
    width: 72,
    height: 54,
    border: "none",
    background: "transparent",
    color: "#999",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    fontSize: 8,
    fontWeight: 800,
    cursor: "pointer",
  },

  navItemActive: {
    color: "#101010",
  },

  navIcon: {
    fontSize: 17,
    lineHeight: 1,
  },

  profileView: {
    maxWidth: 650,
    margin: "0 auto",
    padding: "20px 18px 100px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    color: "#777",
  },

  profileHero: {
    textAlign: "center",
    padding: "35px 0 25px",
  },

  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    background: "#101010",
    color: "#dfc477",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    fontSize: 30,
    fontWeight: 950,
  },

  profileName: {
    margin: 0,
    fontSize: 25,
    fontWeight: 950,
  },

  profileEmail: {
    color: "#777",
    fontSize: 11,
    marginTop: 6,
  },

  profileCard: {
    background: "#fffdf9",
    border: "1px solid #ded8cc",
    borderRadius: 18,
    overflow: "hidden",
  },

  profileRow: {
    minHeight: 52,
    padding: "0 17px",
    borderBottom: "1px solid #eee9e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  profileRowLabel: {
    color: "#777",
    fontSize: 10,
  },

  profileRowValue: {
    fontSize: 10,
    fontWeight: 850,
    textAlign: "right",
  },

  logoutButton: {
    width: "100%",
    marginTop: 15,
    border: "1px solid #cfc7ba",
    background: "#fffdf9",
    color: "#b33",
    borderRadius: 12,
    padding: "13px",
    fontWeight: 850,
    cursor: "pointer",
  },

  statusCard: {
    width: "100%",
    maxWidth: 430,
    background: "#fffdf9",
    border: "1px solid #ded8cc",
    borderRadius: 20,
    padding: 30,
    textAlign: "center",
  },

  statusTitle: {
    margin: 0,
    fontSize: 23,
    fontWeight: 950,
  },

  statusText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 1.6,
    margin: "12px 0 22px",
  },

  errorToast: {
    position: "fixed",
    left: "50%",
    bottom: 82,
    transform: "translateX(-50%)",
    background: "#101010",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 10,
    zIndex: 100,
  },
};
