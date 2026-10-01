"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");

  const [telegramReady, setTelegramReady] = useState(false);

  useEffect(() => {
    const checkTelegram = () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        setTelegramReady(true);
      }
    };

    checkTelegram();

    const timer = setTimeout(checkTelegram, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!telegramReady) return;
    loadUsers();
  }, [telegramReady]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const webApp = window.Telegram?.WebApp;

      if (!webApp?.initData) {
        throw new Error(
          "Telegram authentication data nahi mila."
        );
      }

      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          Authorization: `tma ${webApp.initData}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Users load nahi ho paaye."
        );
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Admin users error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserStatus(telegramId, status) {
    try {
      setActionLoading(`${telegramId}-${status}`);

      const webApp = window.Telegram?.WebApp;

      if (!webApp?.initData) {
        throw new Error(
          "Telegram authentication data nahi mila."
        );
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `tma ${webApp.initData}`,
        },
        body: JSON.stringify({
          telegram_id: telegramId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Action failed."
        );
      }

      await loadUsers();
    } catch (err) {
      console.error("Admin action error:", err);
      alert(err.message || "Action failed.");
    } finally {
      setActionLoading(null);
    }
  }

  const pendingUsers = useMemo(
    () => users.filter((user) => user.status === "pending"),
    [users]
  );

  const joinedUsers = useMemo(
    () => users.filter((user) => user.status === "approved"),
    [users]
  );

  const filteredPending = useMemo(() => {
    const query = search.trim().toLowerCase();

    return pendingUsers.filter((user) => {
      if (!query) return true;

      return (
        String(user.telegram_id).includes(query) ||
        String(user.first_name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.username || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [pendingUsers, search]);

  const filteredJoined = useMemo(() => {
    const query = search.trim().toLowerCase();

    return joinedUsers.filter((user) => {
      if (!query) return true;

      return (
        String(user.telegram_id).includes(query) ||
        String(user.first_name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.username || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [joinedUsers, search]);

  const pendingCount = pendingUsers.length;
  const joinedCount = joinedUsers.length;

  const rejectedCount = users.filter(
    (u) => u.status === "rejected"
  ).length;

  const bannedCount = users.filter(
    (u) => u.status === "banned"
  ).length;

  const totalCount = users.length;

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main style={styles.page}>
        <div style={styles.container}>
          {/* HEADER */}
          <header style={styles.header}>
            <div>
              <button
                onClick={() => router.push("/")}
                style={styles.backButton}
              >
                ← Dashboard
              </button>

              <div style={styles.brandRow}>
                <div style={styles.logo}>S</div>

                <div>
                  <div style={styles.brand}>
                    SAMBHAV UPSC
                  </div>

                  <div style={styles.subtitle}>
                    Administration Center
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={loadUsers}
              style={styles.refreshButton}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </header>

          {/* HERO */}
          <section style={styles.hero}>
            <div>
              <div style={styles.eyebrow}>
                ADMIN CONTROL CENTER
              </div>

              <h1 style={styles.title}>
                Manage your platform.
              </h1>

              <p style={styles.heroText}>
                Manage access requests and joined users
                from one place.
              </p>
            </div>

            <div style={styles.adminBadge}>
              <div style={styles.adminDot} />
              Admin Access
            </div>
          </section>

          {/* STATS */}
          <section style={styles.statsGrid}>
            <StatCard
              label="Total Users"
              value={totalCount}
              icon="◎"
            />

            <StatCard
              label="Pending"
              value={pendingCount}
              icon="◷"
              active
            />

            <StatCard
              label="Joined"
              value={joinedCount}
              icon="✓"
            />

            <StatCard
              label="Rejected"
              value={rejectedCount}
              icon="×"
            />

            <StatCard
              label="Banned"
              value={bannedCount}
              icon="!"
            />
          </section>

          {/* SEARCH */}
          <section style={styles.searchPanel}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>⌕</span>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search name, username or Telegram ID..."
                style={styles.searchInput}
              />
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <div style={styles.errorBox}>
              <strong>Unable to load admin data</strong>

              <div>{error}</div>

              <button
                onClick={loadUsers}
                style={styles.retryButton}
              >
                Try Again
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading && !error && (
            <div style={styles.loadingBox}>
              <div style={styles.loader} />
              Loading admin data...
            </div>
          )}

          {!loading && !error && (
            <>
              {/* ACCESS REQUESTS */}
              <section style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <div style={styles.panelEyebrow}>
                      ACCESS MANAGEMENT
                    </div>

                    <h2 style={styles.panelTitle}>
                      Access Requests
                    </h2>

                    <p style={styles.panelDescription}>
                      Review users waiting for approval.
                    </p>
                  </div>

                  <div style={styles.requestCount}>
                    {pendingCount} pending
                  </div>
                </div>

                {filteredPending.length === 0 ? (
                  <EmptyState
                    icon="✓"
                    title="No pending requests"
                    text="All current access requests have been processed."
                  />
                ) : (
                  <div style={styles.userList}>
                    {filteredPending.map((user) => (
                      <UserCard
                        key={user.telegram_id}
                        user={user}
                        actionLoading={actionLoading}
                        onApprove={() =>
                          updateUserStatus(
                            user.telegram_id,
                            "approved"
                          )
                        }
                        onReject={() =>
                          updateUserStatus(
                            user.telegram_id,
                            "rejected"
                          )
                        }
                        pending
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* JOINED USERS */}
              <section style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <div style={styles.panelEyebrow}>
                      ACTIVE MEMBERS
                    </div>

                    <h2 style={styles.panelTitle}>
                      Joined Users
                    </h2>

                    <p style={styles.panelDescription}>
                      Users who currently have access to
                      SAMBHAV UPSC.
                    </p>
                  </div>

                  <div style={styles.joinedCount}>
                    {joinedCount} joined
                  </div>
                </div>

                {filteredJoined.length === 0 ? (
                  <EmptyState
                    icon="—"
                    title="No joined users"
                    text="Approved users will appear here."
                  />
                ) : (
                  <div style={styles.userList}>
                    {filteredJoined.map((user) => (
                      <JoinedUserCard
                        key={user.telegram_id}
                        user={user}
                        actionLoading={actionLoading}
                        onRemove={() =>
                          updateUserStatus(
                            user.telegram_id,
                            "rejected"
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* SECURITY NOTE */}
              <section style={styles.securityCard}>
                <div style={styles.securityIcon}>
                  ✓
                </div>

                <div>
                  <strong>
                    Access control is active
                  </strong>

                  <p>
                    Removing a joined user does not delete
                    their database record. Their access is
                    changed to rejected, so they can submit
                    a fresh request later.
                  </p>
                </div>
              </section>
            </>
          )}

          <footer style={styles.footer}>
            <span>SAMBHAV UPSC</span>
            <span>Admin Control Center</span>
          </footer>
        </div>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  active,
}) {
  return (
    <div
      style={{
        ...styles.statCard,
        ...(active ? styles.statActive : {}),
      }}
    >
      <div style={styles.statTop}>
        <span style={styles.statLabel}>
          {label}
        </span>

        <span style={styles.statIcon}>
          {icon}
        </span>
      </div>

      <div style={styles.statValue}>
        {value}
      </div>
    </div>
  );
}

function UserCard({
  user,
  actionLoading,
  onApprove,
  onReject,
  pending,
}) {
  const initials =
    (user.first_name || "U")
      .trim()
      .charAt(0)
      .toUpperCase();

  const approving =
    actionLoading ===
    `${user.telegram_id}-approved`;

  const rejecting =
    actionLoading ===
    `${user.telegram_id}-rejected`;

  return (
    <div style={styles.userCard}>
      <div style={styles.userMain}>
        <div style={styles.avatar}>
          {initials}
        </div>

        <div style={styles.userInfo}>
          <div style={styles.userNameRow}>
            <h3 style={styles.userName}>
              {user.first_name || "Unknown User"}
            </h3>

            <StatusBadge status={user.status} />
          </div>

          <div style={styles.userMeta}>
            {user.username
              ? `@${user.username}`
              : "No username"}
          </div>

          <div style={styles.telegramId}>
            Telegram ID: {user.telegram_id}
          </div>

          {user.created_at && (
            <div style={styles.date}>
              Requested{" "}
              {formatDate(user.created_at)}
            </div>
          )}
        </div>
      </div>

      {pending && (
        <div style={styles.actions}>
          <button
            onClick={onReject}
            disabled={rejecting || approving}
            style={styles.cancelButton}
          >
            {rejecting
              ? "Cancelling..."
              : "Cancel"}
          </button>

          <button
            onClick={onApprove}
            disabled={rejecting || approving}
            style={styles.approveButton}
          >
            {approving
              ? "Approving..."
              : "Approve"}
          </button>
        </div>
      )}
    </div>
  );
}

function JoinedUserCard({
  user,
  actionLoading,
  onRemove,
}) {
  const initials =
    (user.first_name || "U")
      .trim()
      .charAt(0)
      .toUpperCase();

  const removing =
    actionLoading ===
    `${user.telegram_id}-rejected`;

  function handleRemove() {
    const confirmed = window.confirm(
      `Remove access from ${
        user.first_name || "this user"
      }?\n\nTheir account will not be deleted. They will be able to request access again with /start.`
    );

    if (!confirmed) return;

    onRemove();
  }

  return (
    <div style={styles.userCard}>
      <div style={styles.userMain}>
        <div style={styles.avatar}>
          {initials}
        </div>

        <div style={styles.userInfo}>
          <div style={styles.userNameRow}>
            <h3 style={styles.userName}>
              {user.first_name || "Unknown User"}
            </h3>

            <StatusBadge status="approved" />
          </div>

          <div style={styles.userMeta}>
            {user.username
              ? `@${user.username}`
              : "No username"}
          </div>

          <div style={styles.telegramId}>
            Telegram ID: {user.telegram_id}
          </div>

          <div style={styles.memberDetails}>
            <span>
              Plan: {user.plan || "free"}
            </span>

            <span>•</span>

            <span>
              Joined:{" "}
              {formatDate(
                user.approved_at ||
                  user.created_at
              )}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          onClick={handleRemove}
          disabled={removing}
          style={styles.removeButton}
        >
          {removing
            ? "Removing..."
            : "Remove Access"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: {
      text: "Pending",
      style: styles.pendingBadge,
    },
    approved: {
      text: "Active",
      style: styles.approvedBadge,
    },
    rejected: {
      text: "Rejected",
      style: styles.rejectedBadge,
    },
    banned: {
      text: "Banned",
      style: styles.bannedBadge,
    },
  };

  const item =
    config[status] || config.pending;

  return (
    <span
      style={{
        ...styles.badge,
        ...item.style,
      }}
    >
      {item.text}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  text,
}) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        {icon}
      </div>

      <h3 style={styles.emptyTitle}>
        {title}
      </h3>

      <p style={styles.emptyText}>
        {text}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f4f2",
    color: "#111",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    padding: "24px 16px 50px",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    marginBottom: "14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    color: "#555",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: "800",
  },

  brand: {
    fontSize: "15px",
    fontWeight: "800",
    letterSpacing: "0.4px",
  },

  subtitle: {
    marginTop: "2px",
    color: "#777",
    fontSize: "12px",
  },

  refreshButton: {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    borderRadius: "12px",
    padding: "11px 15px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  hero: {
    background: "#111",
    color: "#fff",
    borderRadius: "24px",
    padding: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "25px",
    marginBottom: "18px",
  },

  eyebrow: {
    fontSize: "10px",
    letterSpacing: "1.7px",
    color: "#aaa",
    fontWeight: "800",
    marginBottom: "10px",
  },

  title: {
    margin: 0,
    fontSize: "clamp(28px, 5vw, 44px)",
    lineHeight: "1.05",
    letterSpacing: "-1.5px",
  },

  heroText: {
    color: "#aaa",
    margin: "12px 0 0",
    maxWidth: "550px",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  adminBadge: {
    background: "#fff",
    color: "#111",
    borderRadius: "999px",
    padding: "9px 13px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    whiteSpace: "nowrap",
    fontSize: "11px",
    fontWeight: "800",
  },

  adminDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#111",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(165px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e4e4e1",
    borderRadius: "18px",
    padding: "18px",
  },

  statActive: {
    borderColor: "#111",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statLabel: {
    color: "#777",
    fontSize: "11px",
    fontWeight: "700",
  },

  statIcon: {
    fontSize: "18px",
    fontWeight: "800",
  },

  statValue: {
    marginTop: "13px",
    fontSize: "30px",
    fontWeight: "800",
    letterSpacing: "-1px",
  },

  searchPanel: {
    background: "#fff",
    border: "1px solid #e2e2df",
    borderRadius: "18px",
    padding: "15px",
    marginBottom: "18px",
  },

  searchBox: {
    height: "44px",
    background: "#f6f6f4",
    border: "1px solid #e7e7e4",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
  },

  searchIcon: {
    color: "#777",
    fontSize: "20px",
    marginRight: "8px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13px",
    color: "#111",
  },

  panel: {
    background: "#fff",
    border: "1px solid #e2e2df",
    borderRadius: "24px",
    overflow: "hidden",
    marginBottom: "18px",
  },

  panelHeader: {
    padding: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    borderBottom: "1px solid #eee",
  },

  panelEyebrow: {
    fontSize: "10px",
    letterSpacing: "1.4px",
    fontWeight: "800",
    color: "#999",
    marginBottom: "7px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "24px",
    letterSpacing: "-0.7px",
  },

  panelDescription: {
    color: "#777",
    fontSize: "13px",
    margin: "7px 0 0",
  },

  requestCount: {
    background: "#f1f1ef",
    borderRadius: "999px",
    padding: "8px 11px",
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  joinedCount: {
    background: "#111",
    color: "#fff",
    borderRadius: "999px",
    padding: "8px 11px",
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  userList: {
    display: "flex",
    flexDirection: "column",
  },

  userCard: {
    padding: "19px 25px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  userMain: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minWidth: 0,
  },

  avatar: {
    width: "45px",
    height: "45px",
    flexShrink: 0,
    borderRadius: "14px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: "800",
  },

  userInfo: {
    minWidth: 0,
  },

  userNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },

  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "800",
  },

  userMeta: {
    color: "#555",
    fontSize: "12px",
    marginTop: "3px",
  },

  telegramId: {
    color: "#888",
    fontSize: "10px",
    marginTop: "4px",
  },

  date: {
    color: "#aaa",
    fontSize: "10px",
    marginTop: "3px",
  },

  memberDetails: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    color: "#777",
    fontSize: "10px",
    marginTop: "5px",
  },

  badge: {
    borderRadius: "999px",
    padding: "4px 7px",
    fontSize: "9px",
    fontWeight: "800",
  },

  pendingBadge: {
    background: "#f1f1ef",
    color: "#555",
  },

  approvedBadge: {
    background: "#e8e8e5",
    color: "#111",
  },

  rejectedBadge: {
    background: "#f2f2f0",
    color: "#777",
  },

  bannedBadge: {
    background: "#111",
    color: "#fff",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
    flexShrink: 0,
  },

  approveButton: {
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  cancelButton: {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#444",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  removeButton: {
    border: "1px solid #d8d8d5",
    background: "#fff",
    color: "#333",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  emptyState: {
    padding: "60px 25px",
    textAlign: "center",
    color: "#777",
  },

  emptyIcon: {
    width: "44px",
    height: "44px",
    margin: "0 auto 12px",
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  emptyTitle: {
    margin: "0 0 5px",
    color: "#111",
    fontSize: "16px",
  },

  emptyText: {
    margin: 0,
    fontSize: "12px",
  },

  loadingBox: {
    background: "#fff",
    border: "1px solid #e2e2df",
    borderRadius: "20px",
    padding: "60px 20px",
    textAlign: "center",
    color: "#777",
    fontSize: "12px",
  },

  loader: {
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    border: "3px solid #ddd",
    borderTopColor: "#111",
    margin: "0 auto 12px",
  },

  errorBox: {
    marginBottom: "18px",
    padding: "15px",
    borderRadius: "14px",
    background: "#fff",
    border: "1px solid #ddd",
    color: "#555",
    fontSize: "12px",
    lineHeight: "1.6",
  },

  retryButton: {
    marginTop: "10px",
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius: "9px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  securityCard: {
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
    background: "#111",
    color: "#fff",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "18px",
  },

  securityIcon: {
    width: "28px",
    height: "28px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#fff",
    color: "#111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "12px",
  },

  securityCard p: {
    margin: "5px 0 0",
    color: "#aaa",
    fontSize: "11px",
    lineHeight: "1.6",
  },

  footer: {
    padding: "22px 4px",
    display: "flex",
    justifyContent: "space-between",
    color: "#999",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
};
