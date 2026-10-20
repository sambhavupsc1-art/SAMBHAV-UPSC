
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const WORKFLOW = [
  {
    id: "syllabus",
    title: "Syllabus Mapping",
    description: "Topic ko syllabus ke exact demand aur subtopics se map karo.",
    link: null,
  },
  {
    id: "study",
    title: "Concept Preparation",
    description: "Standard sources se concepts samjho aur concise notes banao.",
    link: "/study-materials",
  },
  {
    id: "memorize",
    title: "Active Recall",
    description: "Bina notes dekhe key facts, dimensions aur examples recall karo.",
    link: null,
  },
  {
    id: "pyq",
    title: "PYQ Analysis",
    description: "Related PYQs solve karo aur question ki demand identify karo.",
    link: "/pyq",
  },
  {
    id: "brainstorm",
    title: "Brainstorming",
    description: "Introduction, dimensions, examples, challenges aur way forward nikalo.",
    link: "/mains-roadmap",
  },
  {
    id: "answer",
    title: "Answer Writing",
    description: "Selected question ka time-bound Mains answer likho.",
    link: "/answer",
  },
  {
    id: "revision",
    title: "Revision",
    description: "Pichhle topics revise karo aur weak points note karo.",
    link: null,
  },
];

function dateFromISO(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  return dateFromISO(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function makeSchedule(plan) {
  if (!plan || !Array.isArray(plan.schedule)) return [];

  const start = dateFromISO(plan.start_date);

  return plan.schedule.map((item, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const tasks = Array.isArray(item?.tasks) ? item.tasks : [];

    return {
      ...item,
      day: Number(item?.day) || index + 1,
      date: item?.date || toISODate(date),
      paper: item?.paper || item?.subject || item?.gs_paper || "UPSC Mains",
      topic: item?.topic || item?.title || `Day ${index + 1}`,
      detail:
        item?.detail ||
        item?.description ||
        tasks
          .map((task) => typeof task === "string" ? task : task?.title || task?.text)
          .filter(Boolean)
          .join(" · ") ||
        "Admin ke published plan ke according preparation karein.",
    };
  });
}

export default function SmartUpscPage() {
  const router = useRouter();
  const saveTimer = useRef(null);

  const [userId, setUserId] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [completed, setCompleted] = useState({});
  const [notes, setNotes] = useState({});
  const [search, setSearch] = useState("");
  const [showAllDays, setShowAllDays] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState("");

  const schedule = useMemo(() => makeSchedule(plan), [plan]);
  const duration = Number(plan?.duration_days) || schedule.length;

  const loadPlanAndProgress = useCallback(async () => {
    setPlanLoading(true);
    setSyncError("");

    try {
      const response = await fetch("/api/smart-upsc", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Smart UPSC plan load nahi ho paya.");
      }

      setPlan(data.plan || null);

      if (data.plan && data.progress) {
        const savedTasks = data.progress.completed_tasks;
        const savedNotes = data.progress.notes;

        setCompleted(
          savedTasks && typeof savedTasks === "object" && !Array.isArray(savedTasks)
            ? savedTasks
            : {}
        );
        setNotes(
          savedNotes && typeof savedNotes === "object" && !Array.isArray(savedNotes)
            ? savedNotes
            : {}
        );

        const savedDay = Number(data.progress.current_day);
        setActiveDay(
          Number.isInteger(savedDay) &&
            savedDay >= 1 &&
            savedDay <= Number(data.plan.duration_days)
            ? savedDay
            : 1
        );
      } else {
        setCompleted({});
        setNotes({});
        setActiveDay(1);
      }

      setProgressReady(Boolean(data.plan));
    } catch (error) {
      setSyncError(error.message || "Plan load karte waqt error aaya.");
      setProgressReady(false);
    } finally {
      setPlanLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.user) {
          if (!cancelled) router.replace("/login");
          return;
        }

        const id = String(data.user.id || data.user.user_id || "");

        if (!id) {
          if (!cancelled) router.replace("/login");
          return;
        }

        if (cancelled) return;

        setUserId(id);
        await loadPlanAndProgress();
      } catch {
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    initialize();

    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [router, loadPlanAndProgress]);

  useEffect(() => {
    if (!progressReady || !plan?.id || !userId) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setSyncError("");

      try {
        const response = await fetch("/api/smart-upsc", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: plan.id,
            current_day: Math.min(Math.max(activeDay, 1), duration),
            completed_tasks: completed,
            notes,
          }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Progress save nahi hua.");
        }
      } catch (error) {
        setSyncError(error.message || "Progress sync nahi hua. Internet check karein.");
      } finally {
        setSaving(false);
      }
    }, 650);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [progressReady, plan?.id, userId, activeDay, completed, notes, duration]);

  const currentDay = schedule.find((day) => day.day === activeDay) || schedule[0] || null;

  const dayProgress = completed[activeDay] || {};

  const completedTasks = WORKFLOW.filter(
    (task) => dayProgress[task.id]
  ).length;

  const totalCompleted = schedule.reduce((total, day) => {
    const tasks = completed[day.day] || {};
    return total + WORKFLOW.filter((task) => tasks[task.id]).length;
  }, 0);

  const totalTasks = duration * WORKFLOW.length;
  const overallPercent = Math.round((totalCompleted / totalTasks) * 100);

  const filteredDays = schedule.filter((day) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      String(day.day).includes(query) ||
      day.topic.toLowerCase().includes(query) ||
      day.paper.toLowerCase().includes(query) ||
      day.date.includes(query)
    );
  });

  function toggleTask(taskId) {
    setCompleted((previous) => ({
      ...previous,
      [activeDay]: {
        ...(previous[activeDay] || {}),
        [taskId]: !(previous[activeDay] || {})[taskId],
      },
    }));
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "Kya aap is published plan ka saved progress reset karna chahte hain? Ye database mein bhi save hoga."
    );

    if (!confirmed) return;

    setCompleted({});
    setNotes({});
    setActiveDay(1);
  }

  if (authLoading || planLoading) {
    return (
      <main style={styles.centerPage}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <h2 style={{ margin: "16px 0 6px" }}>Smart UPSC load ho raha hai</h2>
          <p style={styles.muted}>Account, published plan aur saved progress check ho raha hai.</p>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main style={styles.centerPage}>
        <div style={styles.loadingCard}>
          <div style={styles.brand}>SAMBHAV <span style={{ color: "#b08b37" }}>UPSC</span></div>
          <h2 style={{ margin: "18px 0 8px" }}>Abhi koi published plan nahi hai</h2>
          <p style={styles.muted}>Admin panel se Smart UPSC plan publish hone ke baad woh yahan dikhne lagega.</p>
          {syncError && <p style={styles.errorText}>{syncError}</p>}
          <button type="button" style={styles.primaryButton} onClick={() => router.push("/")}>Home par jaayein</button>
          <button type="button" style={styles.textButton} onClick={loadPlanAndProgress}>Dobara check karein</button>
        </div>
      </main>
    );
  }

  if (!currentDay) {
    return (
      <main style={styles.centerPage}>
        <div style={styles.loadingCard}>
          <h2>Published plan ka schedule empty hai</h2>
          <p style={styles.muted}>Admin panel mein har plan day ka schedule add karke publish karein.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={styles.backButton}
          >
            ← Home
          </button>

          <div style={styles.brand}>
            SAMBHAV <span style={{ color: "#b08b37" }}>UPSC</span>
          </div>

          <span style={styles.statusPill}>{duration}-DAY PLAN</span>
        </header>

        <section style={styles.hero}>
          <div style={styles.eyebrow}>YOUR DAILY PREPARATION SYSTEM</div>
          <h1 style={styles.heroTitle}>
            {plan.title || "Study with a clear direction."}
          </h1>
          <p style={styles.heroText}>
            Admin ke published schedule ke according preparation karo. Checklist aur progress tumhare account ke saath database mein save hoti hai.
          </p>

          <div style={styles.heroStats}>
            <div>
              <div style={styles.statNumber}>{duration}</div>
              <div style={styles.statLabel}>Total days</div>
            </div>
            <div>
              <div style={styles.statNumber}>{totalCompleted}</div>
              <div style={styles.statLabel}>Tasks completed</div>
            </div>
            <div>
              <div style={styles.statNumber}>{overallPercent}%</div>
              <div style={styles.statLabel}>Overall progress</div>
            </div>
          </div>

          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${overallPercent}%` }} />
          </div>
          <div style={styles.saveStatus}>
            {saving ? "Progress save ho raha hai…" : syncError ? "Progress sync issue" : "Progress synced with your account"}
          </div>
          {syncError && <p style={styles.errorText}>{syncError}</p>}
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeading}>
            <div>
              <div style={styles.sectionEyebrow}>YOUR PLAN</div>
              <h2 style={styles.sectionTitle}>Daily learning path</h2>
            </div>
            <div style={styles.dateRange}>
              {formatDate(schedule[0]?.date)} – {formatDate(schedule[schedule.length - 1]?.date)}
            </div>
          </div>

          <div style={styles.daySelector}>
            <button
              type="button"
              style={styles.secondaryButton}
              disabled={activeDay <= 1}
              onClick={() => setActiveDay((day) => Math.max(1, day - 1))}
            >
              ← Previous
            </button>

            <label style={styles.dayPickerLabel}>
              Select day
              <select
                value={activeDay}
                onChange={(event) => setActiveDay(Number(event.target.value))}
                style={styles.daySelect}
              >
                {schedule.map((day) => (
                  <option key={day.day} value={day.day}>
                    Day {day.day} — {day.topic}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              style={styles.primaryButton}
              disabled={activeDay >= duration}
              onClick={() => setActiveDay((day) => Math.min(duration, day + 1))}
            >
              Next day →
            </button>
          </div>

          <article style={styles.topicCard}>
            <div style={styles.topicTopline}>
              <span style={styles.topicBadge}>{currentDay.paper}</span>
              <span style={styles.dayNumber}>DAY {currentDay.day}</span>
            </div>

            <h2 style={styles.topicTitle}>{currentDay.topic}</h2>
            <p style={styles.topicDescription}>{currentDay.detail}</p>
            {Array.isArray(currentDay.tasks) && currentDay.tasks.length > 0 && (
              <div style={styles.adminTasks}>
                <strong>Admin ke day-wise tasks</strong>
                <ul>
                  {currentDay.tasks.map((task, index) => (
                    <li key={index}>
                      {typeof task === "string" ? task : task?.title || task?.text || JSON.stringify(task)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={styles.topicFooter}>
              <span>{formatDate(currentDay.date)}</span>
              <strong>
                {completedTasks}/{WORKFLOW.length} tasks complete
              </strong>
            </div>

            <div style={styles.progressTrackLight}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${(completedTasks / WORKFLOW.length) * 100}%`,
                }}
              />
            </div>
          </article>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeading}>
            <div>
              <div style={styles.sectionEyebrow}>DAILY CHECKLIST</div>
              <h2 style={styles.sectionTitle}>Complete your workflow</h2>
            </div>
            <span style={styles.counterPill}>
              {completedTasks}/{WORKFLOW.length}
            </span>
          </div>

          <div style={styles.taskList}>
            {WORKFLOW.map((task, index) => {
              const checked = Boolean(dayProgress[task.id]);

              return (
                <article
                  key={task.id}
                  style={{
                    ...styles.taskCard,
                    borderColor: checked ? "#b7d9c1" : "#e5e9f0",
                    background: checked ? "#f3fbf5" : "#ffffff",
                  }}
                >
                  <button
                    type="button"
                    aria-label={`${checked ? "Mark incomplete" : "Mark complete"}: ${task.title}`}
                    onClick={() => toggleTask(task.id)}
                    style={{
                      ...styles.checkbox,
                      background: checked ? "#247447" : "#ffffff",
                      color: "#ffffff",
                      borderColor: checked ? "#247447" : "#cbd5e1",
                    }}
                  >
                    {checked ? "✓" : ""}
                  </button>

                  <div style={styles.taskBody}>
                    <div style={styles.taskTitleRow}>
                      <span style={styles.taskNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3
                        style={{
                          ...styles.taskTitle,
                          textDecoration: checked ? "line-through" : "none",
                          color: checked ? "#55705f" : "#172033",
                        }}
                      >
                        {task.title}
                      </h3>
                    </div>

                    <p style={styles.taskDescription}>{task.description}</p>

                    {task.link && (
                      <button
                        type="button"
                        style={styles.taskLink}
                        onClick={() => router.push(task.link)}
                      >
                        Open module →
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeading}>
            <div>
              <div style={styles.sectionEyebrow}>PLAN OVERVIEW</div>
              <h2 style={styles.sectionTitle}>Find a day</h2>
            </div>
            <button
              type="button"
              style={styles.textButton}
              onClick={() => setShowAllDays((value) => !value)}
            >
              {showAllDays ? "Hide days" : "View all days"}
            </button>
          </div>

          {showAllDays && (
            <>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search day, topic, GS paper..."
                style={styles.searchInput}
              />

              <div style={styles.dayGrid}>
                {filteredDays.map((day) => {
                  const tasks = completed[day.day] || {};
                  const count = WORKFLOW.filter((task) => tasks[task.id]).length;
                  const isActive = activeDay === day.day;

                  return (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() => {
                        setActiveDay(day.day);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      style={{
                        ...styles.dayCard,
                        borderColor: isActive ? "#b08b37" : "#e2e8f0",
                        background: isActive ? "#fff9e9" : "#ffffff",
                      }}
                    >
                      <span style={styles.dayCardNumber}>DAY {day.day}</span>
                      <strong style={styles.dayCardTopic}>{day.topic}</strong>
                      <span style={styles.dayCardMeta}>{day.paper}</span>
                      <span style={styles.dayCardProgress}>
                        {count}/{WORKFLOW.length} complete
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section style={styles.noticeCard}>
          <strong>Database progress storage</strong>
          <p>
            Checklist, selected day aur notes tumhare login account ke saath Supabase mein save hote hain. Same account se dobara login karoge to progress restore hogi.
          </p>
          <p>Reset karne par current published plan ki saved progress reset hogi.</p>
          <button type="button" style={styles.resetButton} onClick={resetProgress}>
            Reset this plan's progress
          </button>
        </section>

        <footer style={styles.footer}>
          <p>SAMBHAV UPSC · Smart Learning System</p>
          <button type="button" style={styles.textButton} onClick={loadPlanAndProgress}>
            Refresh plan / progress
          </button>
        </footer>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "16px 14px 48px",
  },
  container: { maxWidth: 1100, margin: "0 auto" },
  centerPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "#f5f7fb",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#172033",
  },
  loadingCard: {
    width: "100%",
    maxWidth: 400,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 28,
    textAlign: "center",
    boxSizing: "border-box",
  },
  spinner: {
    width: 32,
    height: 32,
    margin: "0 auto",
    border: "3px solid #e2e8f0",
    borderTopColor: "#b08b37",
    borderRadius: "50%",
    animation: "smartUpscSpin 0.8s linear infinite",
  },
  muted: { color: "#64748b", fontSize: 14, lineHeight: 1.7 },
  errorText: { color: "#b42318", fontSize: 12, lineHeight: 1.6, marginTop: 10 },
  saveStatus: { marginTop: 10, fontSize: 11, color: "#d1d5db" },
  adminTasks: { marginTop: 16, padding: 14, borderRadius: 12, background: "#f8fafc", color: "#334155", fontSize: 12, lineHeight: 1.7 },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    margin: "0 auto 20px",
  },
  backButton: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    background: "#ffffff",
    padding: "10px 13px",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  },
  brand: { fontWeight: 950, fontSize: 17, letterSpacing: "-0.6px" },
  statusPill: {
    borderRadius: 999,
    padding: "7px 11px",
    background: "#fff6dc",
    color: "#88651a",
    fontWeight: 850,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  hero: {
    background: "linear-gradient(135deg, #10151f 0%, #222b3a 65%, #3a3020 100%)",
    borderRadius: 24,
    color: "#ffffff",
    padding: "clamp(23px, 5vw, 42px)",
    boxShadow: "0 18px 42px rgba(15,23,42,.13)",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 900,
    color: "#e3c777",
  },
  heroTitle: {
    fontSize: "clamp(30px, 6vw, 48px)",
    lineHeight: 1.08,
    letterSpacing: "-1.8px",
    margin: "16px 0 12px",
    maxWidth: 700,
  },
  heroText: { maxWidth: 610, color: "#d1d5db", fontSize: 14, lineHeight: 1.8, margin: 0 },
  heroStats: {
    display: "flex",
    gap: 30,
    flexWrap: "wrap",
    marginTop: 28,
    paddingTop: 22,
    borderTop: "1px solid rgba(255,255,255,.14)",
  },
  statNumber: { fontSize: 24, fontWeight: 900 },
  statLabel: { marginTop: 4, color: "#b7bdc8", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  progressTrack: { height: 7, background: "rgba(255,255,255,.14)", borderRadius: 99, overflow: "hidden", marginTop: 22 },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #b08b37, #e3c777)", borderRadius: 99, transition: "width .2s ease" },
  section: { marginTop: 32 },
  sectionHeading: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 15 },
  sectionEyebrow: { color: "#a17a25", fontSize: 10, fontWeight: 900, letterSpacing: 1.6 },
  sectionTitle: { margin: "5px 0 0", fontSize: "clamp(21px, 4vw, 28px)", letterSpacing: "-.7px" },
  dateRange: { color: "#64748b", fontSize: 12, fontWeight: 700 },
  daySelector: { display: "flex", alignItems: "end", gap: 10, flexWrap: "wrap", marginBottom: 15 },
  dayPickerLabel: { display: "flex", flexDirection: "column", gap: 5, flex: "1 1 240px", color: "#64748b", fontSize: 11, fontWeight: 800 },
  daySelect: { width: "100%", border: "1px solid #dbe2ed", borderRadius: 11, background: "#ffffff", color: "#172033", padding: "11px 12px", fontSize: 13, minHeight: 43 },
  secondaryButton: { border: "1px solid #dbe2ed", borderRadius: 11, padding: "12px 14px", background: "#ffffff", color: "#334155", cursor: "pointer", fontWeight: 800, minHeight: 43 },
  primaryButton: { border: "1px solid #172033", borderRadius: 11, padding: "12px 14px", background: "#172033", color: "#ffffff", cursor: "pointer", fontWeight: 800, minHeight: 43 },
  topicCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "clamp(18px, 4vw, 28px)", boxShadow: "0 6px 22px rgba(15,23,42,.035)" },
  topicTopline: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  topicBadge: { borderRadius: 8, padding: "6px 9px", background: "#edf2ff", color: "#354ca2", fontSize: 11, fontWeight: 900 },
  dayNumber: { color: "#94a3b8", fontSize: 11, fontWeight: 900, letterSpacing: 1.2 },
  topicTitle: { fontSize: "clamp(23px, 4vw, 34px)", letterSpacing: "-.8px", margin: "17px 0 8px" },
  topicDescription: { color: "#526078", fontSize: 14, lineHeight: 1.8, margin: 0 },
  topicNote: { color: "#8a6b25", background: "#fffaec", border: "1px solid #f2e3b8", borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.7, marginTop: 17 },
  topicFooter: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 20, color: "#64748b", fontSize: 12 },
  progressTrackLight: { height: 6, background: "#edf0f5", borderRadius: 99, overflow: "hidden", marginTop: 12 },
  counterPill: { borderRadius: 999, background: "#eaf6ee", color: "#247447", padding: "8px 12px", fontSize: 12, fontWeight: 900 },
  taskList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 12 },
  taskCard: { display: "flex", alignItems: "start", gap: 13, padding: 16, border: "1px solid #e5e9f0", borderRadius: 16, transition: "background .15s ease, border-color .15s ease" },
  checkbox: { width: 25, height: 25, flex: "0 0 25px", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 900, fontSize: 15, marginTop: 1 },
  taskBody: { minWidth: 0, flex: 1 },
  taskTitleRow: { display: "flex", alignItems: "center", gap: 9 },
  taskNumber: { color: "#a17a25", fontSize: 10, fontWeight: 900 },
  taskTitle: { margin: 0, fontSize: 14, fontWeight: 850 },
  taskDescription: { margin: "7px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.7 },
  taskLink: { marginTop: 9, border: 0, padding: 0, background: "transparent", color: "#3158b7", fontWeight: 850, fontSize: 12, cursor: "pointer" },
  textButton: { border: 0, background: "transparent", color: "#3158b7", fontWeight: 850, cursor: "pointer", padding: "8px 0" },
  searchInput: { width: "100%", boxSizing: "border-box", border: "1px solid #dbe2ed", borderRadius: 11, background: "#ffffff", padding: 13, fontSize: 14, marginBottom: 12 },
  dayGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 10 },
  dayCard: { display: "flex", flexDirection: "column", alignItems: "start", gap: 7, textAlign: "left", border: "1px solid #e2e8f0", borderRadius: 13, padding: 13, cursor: "pointer", minWidth: 0 },
  dayCardNumber: { color: "#a17a25", fontSize: 9, fontWeight: 900, letterSpacing: 1 },
  dayCardTopic: { fontSize: 13, lineHeight: 1.4 },
  dayCardMeta: { color: "#64748b", fontSize: 11 },
  dayCardProgress: { color: "#247447", fontSize: 10, fontWeight: 800, marginTop: 3 },
  noticeCard: { marginTop: 30, background: "#fff9e9", border: "1px solid #f2e3b8", borderRadius: 15, padding: 16, color: "#795b1d", fontSize: 12, lineHeight: 1.7 },
  resetButton: { border: "1px solid #e2e8f0", borderRadius: 10, background: "#ffffff", color: "#64748b", padding: "9px 12px", cursor: "pointer", fontSize: 11, fontWeight: 800 },
  footer: { marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", color: "#94a3b8", fontSize: 11 },
};
