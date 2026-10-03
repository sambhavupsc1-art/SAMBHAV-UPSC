"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [lastPendingCount, setLastPendingCount] =
    useState(null);

  const [notificationCount, setNotificationCount] =
    useState(0);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadUsers();
  }, []);

  /* =========================================================
     AUTO REFRESH
     10 SECONDS
  ========================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     LOAD USERS
  ========================================================= */

  async function loadUsers(silent = false) {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "/api/admin/users",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Users load nahi ho paaye."
        );
      }

      const nextUsers = Array.isArray(
        data.users
      )
        ? data.users
        : [];

      const nextPendingCount =
        nextUsers.filter(
          (user) =>
            user.status === "pending"
        ).length;

      /* =====================================================
         NEW REQUEST DETECTION
      ===================================================== */

      if (
        lastPendingCount !== null &&
        nextPendingCount > lastPendingCount
      ) {
        const difference =
          nextPendingCount -
          lastPendingCount;

        setNotificationCount(
          (previous) =>
            previous + difference
        );

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission ===
            "granted"
        ) {
          new Notification(
            "SAMBHAV UPSC",
            {
              body:
                `${difference} new access request` +
                (difference > 1
                  ? "s"
                  : "") +
                " received.",
            }
          );
        }
      }

      setLastPendingCount(
        nextPendingCount
      );

      setUsers(nextUsers);

      if (data.admin) {
        setAdmin(data.admin);
      }
    } catch (err) {
      console.error(
        "Admin users error:",
        err
      );

      if (!silent) {
        setError(
          err.message ||
            "Something went wrong."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  /* =========================================================
     ENABLE NOTIFICATIONS
  ========================================================= */

  async function enableNotifications() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      alert(
        "Is device/browser par notifications supported nahi hain."
      );
      return;
    }

    try {
      const permission =
        await Notification.requestPermission();

      if (permission === "granted") {
        alert(
          "Admin notifications enabled."
        );
      }
    } catch (error) {
      console.error(
        "Notification permission error:",
        error
      );
    }
  }

  /* =========================================================
     CLEAR NOTIFICATIONS
  ========================================================= */

  function clearNotifications() {
    setNotificationCount(0);
  }

  /* =========================================================
     UPDATE USER STATUS
  ========================================================= */

  async function updateUserStatus(
    userId,
    status
  ) {
    try {
      setActionLoading(
        `${userId}-${status}`
      );

      const response = await fetch(
        "/api/admin/users",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Action failed."
        );
      }

      await loadUsers(true);
    } catch (err) {
      console.error(
        "Admin action error:",
        err
      );

      alert(
        err.message ||
          "Action failed."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* =========================================================
     USER GROUPS
  ========================================================= */

  const pendingUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.status === "pending"
      ),
    [users]
  );

  const joinedUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.status === "approved"
      ),
    [users]
  );

  const bannedUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.status === "banned"
      ),
    [users]
  );

  const rejectedUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.status === "rejected"
      ),
    [users]
  );

  /* =========================================================
     PREMIUM / DEMO / FREE
  ========================================================= */

  const premiumUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.premium_active === true
      ),
    [users]
  );

  const demoUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.premium_active === true &&
          String(
            user.premium_plan || ""
          ).toLowerCase() === "demo"
      ),
    [users]
  );

  const paidPremiumUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.premium_active === true &&
          String(
            user.premium_plan || ""
          ).toLowerCase() !== "demo"
      ),
    [users]
  );

  const freeUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          !user.premium_active
      ),
    [users]
  );

  /* =========================================================
     SEARCH
  ========================================================= */

  const filterUsers = (list) => {
    let result = [...list];

    if (filter === "premium") {
      result = result.filter(
        (user) =>
          user.premium_active === true
      );
    }

    if (filter === "demo") {
      result = result.filter(
        (user) =>
          user.premium_active === true &&
          String(
            user.premium_plan || ""
          ).toLowerCase() === "demo"
      );
    }

    if (filter === "free") {
      result = result.filter(
        (user) =>
          !user.premium_active
      );
    }

    if (filter === "pending") {
      result = result.filter(
        (user) =>
          user.status === "pending"
      );
    }

    if (filter === "banned") {
      result = result.filter(
        (user) =>
          user.status === "banned"
      );
    }

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return result;
    }

    return result.filter((user) => {
      return (
        String(
          user.first_name || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          user.email || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          user.username || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          user.telegram_id || ""
        ).includes(query) ||
        String(
          user.id || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          user.order_id || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          user.payment_id || ""
        )
          .toLowerCase()
          .includes(query)
      );
    });
  };

  const filteredUsers =
    filterUsers(users);

  const filteredPending =
    filterUsers(pendingUsers);

  const filteredJoined =
    filterUsers(joinedUsers);

  const filteredBanned =
    filterUsers(bannedUsers);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <header style={styles.header}>
          <div>
            <button
              onClick={() =>
                router.push("/")
              }
              style={
                styles.backButton
              }
            >
              ← Dashboard
            </button>

            <div
              style={
                styles.brandRow
              }
            >
              <div
                style={
                  styles.logo
                }
              >
                S
              </div>

              <div>
                <div
                  style={
                    styles.brand
                  }
                >
                  SAMBHAV UPSC
                </div>

                <div
                  style={
                    styles.subtitle
                  }
                >
                  Administration Center
                </div>
              </div>
            </div>
          </div>

          <div
            style={
              styles.headerRight
            }
          >
            {admin?.email && (
              <div
                style={
                  styles.adminIdentity
                }
              >
                <div
                  style={
                    styles.adminIdentityLabel
                  }
                >
                  ADMIN
                </div>

                <div
                  style={
                    styles.adminIdentityEmail
                  }
                >
                  {admin.email}
                </div>
              </div>
            )}

            {/* NOTIFICATION */}

            <div
              style={
                styles.notificationWrapper
              }
            >
              <button
                onClick={() => {
                  setShowNotifications(
                    !showNotifications
                  );

                  if (
                    !showNotifications
                  ) {
                    clearNotifications();
                  }
                }}
                style={
                  styles.notificationButton
                }
              >
                <span>♢</span>

                {notificationCount >
                  0 && (
                  <span
                    style={
                      styles.notificationBadge
                    }
                  >
                    {notificationCount >
                    99
                      ? "99+"
                      : notificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  style={
                    styles.notificationPanel
                  }
                >
                  <div
                    style={
                      styles.notificationHeader
                    }
                  >
                    <div>
                      <div
                        style={
                          styles.notificationEyebrow
                        }
                      >
                        SYSTEM
                      </div>

                      <strong>
                        Notifications
                      </strong>
                    </div>

                    <button
                      onClick={() =>
                        setShowNotifications(
                          false
                        )
                      }
                      style={
                        styles.closeNotification
                      }
                    >
                      ×
                    </button>
                  </div>

                  {pendingUsers.length >
                  0 ? (
                    <>
                      <div
                        style={
                          styles.notificationItem
                        }
                      >
                        <div
                          style={
                            styles.notificationDot
                          }
                        />

                        <div>
                          <strong>
                            Access Requests
                          </strong>

                          <div
                            style={
                              styles.notificationText
                            }
                          >
                            {
                              pendingUsers.length
                            }{" "}
                            user
                            {pendingUsers.length >
                            1
                              ? "s are"
                              : " is"}{" "}
                            waiting for approval.
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowNotifications(
                            false
                          );

                          setFilter(
                            "pending"
                          );

                          window.scrollTo(
                            {
                              top: 600,
                              behavior:
                                "smooth",
                            }
                          );
                        }}
                        style={
                          styles.reviewButton
                        }
                      >
                        Review Requests →
                      </button>
                    </>
                  ) : (
                    <div
                      style={
                        styles.noNotification
                      }
                    >
                      <div
                        style={
                          styles.noNotificationIcon
                        }
                      >
                        ✓
                      </div>

                      <strong>
                        All clear
                      </strong>

                      <p>
                        No pending access
                        requests.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={
                enableNotifications
              }
              style={
                styles.headerButton
              }
            >
              Enable Alerts
            </button>

            <button
              onClick={() =>
                loadUsers()
              }
              style={
                styles.headerButton
              }
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* =================================================
            HERO
        ================================================= */}

        <section
          style={styles.hero}
        >
          <div>
            <div
              style={
                styles.heroEyebrow
              }
            >
              SAMBHAV / ADMIN
            </div>

            <h1
              style={
                styles.heroTitle
              }
            >
              Platform
              <br />
              Control Center.
            </h1>

            <p
              style={
                styles.heroText
              }
            >
              Manage members, access,
              Premium subscriptions and
              account security from one
              place.
            </p>
          </div>

          <div
            style={
              styles.heroRight
            }
          >
            <div
              style={
                styles.liveBadge
              }
            >
              <span
                style={
                  styles.liveDot
                }
              />
              SYSTEM LIVE
            </div>

            <div
              style={
                styles.heroTotal
              }
            >
              {users.length}
            </div>

            <div
              style={
                styles.heroTotalLabel
              }
            >
              TOTAL ACCOUNTS
            </div>
          </div>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section
          style={
            styles.statsGrid
          }
        >
          <StatCard
            label="Total Users"
            value={
              users.length
            }
            detail="All accounts"
            icon="◎"
          />

          <StatCard
            label="Pending"
            value={
              pendingUsers.length
            }
            detail="Awaiting approval"
            icon="◷"
            active={
              pendingUsers.length >
              0
            }
          />

          <StatCard
            label="Premium"
            value={
              premiumUsers.length
            }
            detail="Currently active"
            icon="✦"
            premium
          />

          <StatCard
            label="Demo"
            value={
              demoUsers.length
            }
            detail="Active demo access"
            icon="◇"
          />

          <StatCard
            label="Free"
            value={
              freeUsers.length
            }
            detail="No active Premium"
            icon="○"
          />

          <StatCard
            label="Blocked"
            value={
              bannedUsers.length
            }
            detail="Restricted accounts"
            icon="!"
          />
        </section>

        {/* =================================================
            SEARCH
        ================================================= */}

        <section
          style={
            styles.searchPanel
          }
        >
          <div
            style={
              styles.searchHeader
            }
          >
            <div>
              <div
                style={
                  styles.searchEyebrow
                }
              >
                USER DIRECTORY
              </div>

              <div
                style={
                  styles.searchTitle
                }
              >
                Find any account
              </div>
            </div>

            <div
              style={
                styles.resultCount
              }
            >
              {filteredUsers.length}{" "}
              results
            </div>
          </div>

          <div
            style={
              styles.searchBox
            }
          >
            <span
              style={
                styles.searchIcon
              }
            >
              ⌕
            </span>

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search name, email, username, Telegram ID, order ID..."
              style={
                styles.searchInput
              }
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                style={
                  styles.clearSearch
                }
              >
                ×
              </button>
            )}
          </div>

          <div
            style={
              styles.filterRow
            }
          >
            <FilterButton
              active={
                filter === "all"
              }
              onClick={() =>
                setFilter("all")
              }
              label="All"
              count={
                users.length
              }
            />

            <FilterButton
              active={
                filter === "pending"
              }
              onClick={() =>
                setFilter("pending")
              }
              label="Pending"
              count={
                pendingUsers.length
              }
            />

            <FilterButton
              active={
                filter === "premium"
              }
              onClick={() =>
                setFilter("premium")
              }
              label="Premium"
              count={
                premiumUsers.length
              }
            />

            <FilterButton
              active={
                filter === "demo"
              }
              onClick={() =>
                setFilter("demo")
              }
              label="Demo"
              count={
                demoUsers.length
              }
            />

            <FilterButton
              active={
                filter === "free"
              }
              onClick={() =>
                setFilter("free")
              }
              label="Free"
              count={
                freeUsers.length
              }
            />

            <FilterButton
              active={
                filter === "banned"
              }
              onClick={() =>
                setFilter("banned")
              }
              label="Blocked"
              count={
                bannedUsers.length
              }
            />
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={
              styles.errorBox
            }
          >
            <div
              style={
                styles.errorIcon
              }
            >
              !
            </div>

            <div>
              <strong>
                Unable to load admin
                data
              </strong>

              <div
                style={
                  styles.errorText
                }
              >
                {error}
              </div>

              <button
                onClick={() =>
                  loadUsers()
                }
                style={
                  styles.retryButton
                }
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && !error && (
          <div
            style={
              styles.loadingBox
            }
          >
            <div
              style={
                styles.loadingOrb
              }
            />

            <strong>
              Loading Admin Center
            </strong>

            <span>
              Fetching live account data...
            </span>
          </div>
        )}

        {/* =================================================
            CONTENT
        ================================================= */}

        {!loading &&
          !error && (
            <>
              {/* ===========================================
                  ACCESS REQUESTS
              =========================================== */}

              <section
                style={
                  styles.panel
                }
              >
                <div
                  style={
                    styles.panelHeader
                  }
                >
                  <div>
                    <div
                      style={
                        styles.panelEyebrow
                      }
                    >
                      ACCESS MANAGEMENT
                    </div>

                    <h2
                      style={
                        styles.panelTitle
                      }
                    >
                      Access Requests
                    </h2>

                    <p
                      style={
                        styles.panelDescription
                      }
                    >
                      Review and manage
                      accounts waiting for
                      approval.
                    </p>
                  </div>

                  <div
                    style={
                      styles.panelCounter
                    }
                  >
                    {
                      filteredPending.length
                    }
                    <span>
                      pending
                    </span>
                  </div>
                </div>

                {filteredPending.length ===
                0 ? (
                  <EmptyState
                    icon="✓"
                    title="No pending requests"
                    text="All current access requests have been processed."
                  />
                ) : (
                  <div
                    style={
                      styles.userList
                    }
                  >
                    {filteredPending.map(
                      (user) => (
                        <PendingUserCard
                          key={
                            user.id
                          }
                          user={user}
                          actionLoading={
                            actionLoading
                          }
                          onApprove={() =>
                            updateUserStatus(
                              user.id,
                              "approved"
                            )
                          }
                          onReject={() =>
                            updateUserStatus(
                              user.id,
                              "rejected"
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </section>

              {/* ===========================================
                  JOINED USERS
              =========================================== */}

              <section
                style={
                  styles.panel
                }
              >
                <div
                  style={
                    styles.panelHeader
                  }
                >
                  <div>
                    <div
                      style={
                        styles.panelEyebrow
                      }
                    >
                      MEMBER DIRECTORY
                    </div>

                    <h2
                      style={
                        styles.panelTitle
                      }
                    >
                      Joined Users
                    </h2>

                    <p
                      style={
                        styles.panelDescription
                      }
                    >
                      Complete account and
                      subscription overview.
                    </p>
                  </div>

                  <div
                    style={
                      styles.panelCounterDark
                    }
                  >
                    {
                      filteredJoined.length
                    }
                    <span>
                      active
                    </span>
                  </div>
                </div>

                {filteredJoined.length ===
                0 ? (
                  <EmptyState
                    icon="—"
                    title="No users found"
                    text="Approved accounts will appear here."
                  />
                ) : (
                  <div
                    style={
                      styles.userList
                    }
                  >
                    {filteredJoined.map(
                      (user) => (
                        <JoinedUserCard
                          key={
                            user.id
                          }
                          user={user}
                          actionLoading={
                            actionLoading
                          }
                          onRemove={() =>
                            updateUserStatus(
                              user.id,
                              "rejected"
                            )
                          }
                          onBlock={() =>
                            updateUserStatus(
                              user.id,
                              "banned"
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </section>

              {/* ===========================================
                  BLOCKED
              =========================================== */}

              {filteredBanned.length >
                0 && (
                <section
                  style={
                    styles.panel
                  }
                >
                  <div
                    style={
                      styles.panelHeader
                    }
                  >
                    <div>
                      <div
                        style={
                          styles.panelEyebrow
                        }
                      >
                        SECURITY
                      </div>

                      <h2
                        style={
                          styles.panelTitle
                        }
                      >
                        Blocked Users
                      </h2>

                      <p
                        style={
                          styles.panelDescription
                        }
                      >
                        Accounts currently
                        restricted from access.
                      </p>
                    </div>

                    <div
                      style={
                        styles.panelCounterDark
                      }
                    >
                      {
                        filteredBanned.length
                      }
                      <span>
                        blocked
                      </span>
                    </div>
                  </div>

                  <div
                    style={
                      styles.userList
                    }
                  >
                    {filteredBanned.map(
                      (user) => (
                        <BannedUserCard
                          key={
                            user.id
                          }
                          user={user}
                          actionLoading={
                            actionLoading
                          }
                          onUnblock={() =>
                            updateUserStatus(
                              user.id,
                              "rejected"
                            )
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )}

              {/* ===========================================
                  PREMIUM OVERVIEW
              =========================================== */}

              <section
                style={
                  styles.premiumOverview
                }
              >
                <div>
                  <div
                    style={
                      styles.premiumEyebrow
                    }
                  >
                    PREMIUM OVERVIEW
                  </div>

                  <h2
                    style={
                      styles.premiumTitle
                    }
                  >
                    Subscription
                    intelligence.
                  </h2>

                  <p
                    style={
                      styles.premiumDescription
                    }
                  >
                    {paidPremiumUsers.length}{" "}
                    paid Premium account
                    {paidPremiumUsers.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    and{" "}
                    {demoUsers.length}{" "}
                    active demo account
                    {demoUsers.length !==
                    1
                      ? "s"
                      : ""}.
                  </p>
                </div>

                <div
                  style={
                    styles.premiumNumbers
                  }
                >
                  <div>
                    <strong>
                      {
                        paidPremiumUsers.length
                      }
                    </strong>

                    <span>
                      Paid
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        demoUsers.length
                      }
                    </strong>

                    <span>
                      Demo
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        premiumUsers.length
                      }
                    </strong>

                    <span>
                      Active
                    </span>
                  </div>
                </div>
              </section>

              {/* ===========================================
                  SECURITY
              =========================================== */}

              <section
                style={
                  styles.securityCard
                }
              >
                <div
                  style={
                    styles.securityIcon
                  }
                >
                  ✓
                </div>

                <div>
                  <strong>
                    Access control is active
                  </strong>

                  <p
                    style={
                      styles.securityText
                    }
                  >
                    Remove Access allows
                    the account to request
                    access again. Block User
                    keeps the account
                    restricted.
                  </p>
                </div>

                <div
                  style={
                    styles.securityStatus
                  }
                >
                  PROTECTED
                </div>
              </section>
            </>
          )}

        <footer
          style={
            styles.footer
          }
        >
          <span>
            SAMBHAV UPSC
          </span>

          <span>
            Admin Control Center
          </span>

          <span>
            Live • Secure
          </span>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  detail,
  icon,
  active,
  premium,
}) {
  return (
    <div
      style={{
        ...styles.statCard,
        ...(active
          ? styles.statActive
          : {}),
        ...(premium
          ? styles.statPremium
          : {}),
      }}
    >
      <div
        style={
          styles.statTop
        }
      >
        <span
          style={
            styles.statLabel
          }
        >
          {label}
        </span>

        <span
          style={
            styles.statIcon
          }
        >
          {icon}
        </span>
      </div>

      <div
        style={
          styles.statValue
        }
      >
        {value}
      </div>

      <div
        style={
          styles.statDetail
        }
      >
        {detail}
      </div>
    </div>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({
  active,
  onClick,
  label,
  count,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.filterButton,
        ...(active
          ? styles.filterButtonActive
          : {}),
      }}
    >
      {label}

      <span
        style={{
          ...styles.filterCount,
          ...(active
            ? styles.filterCountActive
            : {}),
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* =========================================================
   PENDING USER
========================================================= */

function PendingUserCard({
  user,
  actionLoading,
  onApprove,
  onReject,
}) {
  const approving =
    actionLoading ===
    `${user.id}-approved`;

  const rejecting =
    actionLoading ===
    `${user.id}-rejected`;

  return (
    <div
      style={
        styles.userCard
      }
    >
      <UserInfo
        user={user}
        status="pending"
      />

      <div
        style={
          styles.actions
        }
      >
        <button
          onClick={onReject}
          disabled={
            rejecting ||
            approving
          }
          style={
            styles.cancelButton
          }
        >
          {rejecting
            ? "Cancelling..."
            : "Reject"}
        </button>

        <button
          onClick={onApprove}
          disabled={
            rejecting ||
            approving
          }
          style={
            styles.approveButton
          }
        >
          {approving
            ? "Approving..."
            : "Approve"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   JOINED USER
========================================================= */

function JoinedUserCard({
  user,
  actionLoading,
  onRemove,
  onBlock,
}) {
  const removing =
    actionLoading ===
    `${user.id}-rejected`;

  const blocking =
    actionLoading ===
    `${user.id}-banned`;

  function handleRemove() {
    const confirmed =
      window.confirm(
        `Remove access from ${
          user.first_name ||
          user.email ||
          "this user"
        }?\n\nThey will be able to access the account again after the account is approved.`
      );

    if (confirmed) {
      onRemove();
    }
  }

  function handleBlock() {
    const confirmed =
      window.confirm(
        `Block ${
          user.first_name ||
          user.email ||
          "this user"
        }?\n\nThis account will be blocked from access.`
      );

    if (confirmed) {
      onBlock();
    }
  }

  return (
    <div
      style={{
        ...styles.userCard,
        ...(user.premium_active
          ? styles.premiumUserCard
          : {}),
      }}
    >
      <UserInfo
        user={user}
        status="approved"
        joined
      />

      <div
        style={
          styles.actions
        }
      >
        <button
          onClick={
            handleRemove
          }
          disabled={
            removing ||
            blocking
          }
          style={
            styles.removeButton
          }
        >
          {removing
            ? "Removing..."
            : "Remove"}
        </button>

        <button
          onClick={
            handleBlock
          }
          disabled={
            removing ||
            blocking
          }
          style={
            styles.blockButton
          }
        >
          {blocking
            ? "Blocking..."
            : "Block"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   BANNED USER
========================================================= */

function BannedUserCard({
  user,
  actionLoading,
  onUnblock,
}) {
  const unblocking =
    actionLoading ===
    `${user.id}-rejected`;

  function handleUnblock() {
    const confirmed =
      window.confirm(
        `Unblock ${
          user.first_name ||
          user.email ||
          "this user"
        }?`
      );

    if (confirmed) {
      onUnblock();
    }
  }

  return (
    <div
      style={
        styles.userCard
      }
    >
      <UserInfo
        user={user}
        status="banned"
      />

      <button
        onClick={
          handleUnblock
        }
        disabled={
          unblocking
        }
        style={
          styles.unblockButton
        }
      >
        {unblocking
          ? "Unblocking..."
          : "Unblock"}
      </button>
    </div>
  );
}

/* =========================================================
   USER INFO
========================================================= */

function UserInfo({
  user,
  status,
  joined,
}) {
  const initials =
    (
      user.first_name ||
      user.email ||
      "U"
    )
      .trim()
      .charAt(0)
      .toUpperCase();

  const plan =
    String(
      user.premium_plan ||
        user.plan ||
        "free"
    ).toLowerCase();

  const isPremium =
    user.premium_active === true;

  const isDemo =
    isPremium &&
    plan === "demo";

  return (
    <div
      style={
        styles.userMain
      }
    >
      <div
        style={{
          ...styles.avatar,
          ...(isPremium
            ? styles.premiumAvatar
            : {}),
        }}
      >
        {initials}
      </div>

      <div
        style={
          styles.userInfo
        }
      >
        <div
          style={
            styles.userNameRow
          }
        >
          <h3
            style={
              styles.userName
            }
          >
            {user.first_name ||
              "Unknown User"}
          </h3>

          <StatusBadge
            status={status}
          />

          {isPremium && (
            <span
              style={
                isDemo
                  ? styles.demoBadge
                  : styles.premiumBadge
              }
            >
              {isDemo
                ? "DEMO"
                : "PREMIUM"}
            </span>
          )}
        </div>

        <div
          style={
            styles.email
          }
        >
          {user.email ||
            "No email"}
        </div>

        <div
          style={
            styles.userMetaRow
          }
        >
          <span>
            {user.username
              ? `@${user.username}`
              : "No username"}
          </span>

          {user.telegram_id && (
            <>
              <span>•</span>

              <span>
                TG {user.telegram_id}
              </span>
            </>
          )}
        </div>

        <div
          style={
            styles.accountDetails
          }
        >
          <InfoItem
            label="Joined"
            value={formatDate(
              user.created_at
            )}
          />

          <InfoItem
            label="Last login"
            value={formatDateTime(
              user.last_login_at
            )}
          />

          <InfoItem
            label="Plan"
            value={
              isPremium
                ? formatPlan(
                    plan
                  )
                : "Free"
            }
          />

          {isPremium && (
            <InfoItem
              label="Expires"
              value={formatDateTime(
                user.premium_expires_at
              )}
            />
          )}
        </div>

        {isPremium && (
          <div
            style={
              styles.subscriptionRow
            }
          >
            {user.order_id && (
              <span>
                Order:{" "}
                {shortId(
                  user.order_id
                )}
              </span>
            )}

            {user.payment_id && (
              <span>
                Payment:{" "}
                {shortId(
                  user.payment_id
                )}
              </span>
            )}

            {user.subscription_amount !==
              null &&
              user.subscription_amount !==
                undefined && (
                <span>
                  ₹
                  {
                    user.subscription_amount
                  }
                </span>
              )}
          </div>
        )}

        {!joined &&
          user.created_at && (
            <div
              style={
                styles.requested
              }
            >
              Requested{" "}
              {formatDateTime(
                user.created_at
              )}
            </div>
          )}
      </div>
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}) {
  return (
    <div
      style={
        styles.infoItem
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  const config = {
    pending: {
      text: "Pending",
      style:
        styles.pendingBadge,
    },

    approved: {
      text: "Active",
      style:
        styles.approvedBadge,
    },

    rejected: {
      text: "Rejected",
      style:
        styles.rejectedBadge,
    },

    banned: {
      text: "Blocked",
      style:
        styles.bannedBadge,
    },
  };

  const item =
    config[status] ||
    config.pending;

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

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon,
  title,
  text,
}) {
  return (
    <div
      style={
        styles.emptyState
      }
    >
      <div
        style={
          styles.emptyIcon
        }
      >
        {icon}
      </div>

      <h3
        style={
          styles.emptyTitle
        }
      >
        {title}
      </h3>

      <p
        style={
          styles.emptyText
        }
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

function formatDateTime(value) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

function formatPlan(plan) {
  if (!plan) return "Free";

  return String(plan)
    .charAt(0)
    .toUpperCase() +
    String(plan).slice(1);
}

function shortId(value) {
  if (!value) return "—";

  const text = String(value);

  if (text.length <= 18) {
    return text;
  }

  return (
    text.slice(0, 8) +
    "..." +
    text.slice(-6)
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#f6f6f3 0%,#eeeeeb 100%)",
    color: "#111",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif',
    padding:
      "24px 16px 60px",
  },

  container: {
    width: "100%",
    maxWidth: "1240px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom:
      "28px",
  },

  headerRight: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent:
      "flex-end",
  },

  backButton: {
    border: "none",
    background:
      "transparent",
    padding: 0,
    marginBottom:
      "14px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    color: "#666",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg,#111,#303030)",
    color: "#fff",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontSize: "19px",
    fontWeight: "900",
    boxShadow:
      "0 8px 22px rgba(0,0,0,.16)",
  },

  brand: {
    fontSize: "15px",
    fontWeight: "900",
    letterSpacing:
      ".3px",
  },

  subtitle: {
    marginTop: "3px",
    color: "#888",
    fontSize: "11px",
  },

  adminIdentity: {
    padding:
      "7px 11px",
    background:
      "rgba(255,255,255,.75)",
    border:
      "1px solid #ddd",
    borderRadius:
      "11px",
  },

  adminIdentityLabel: {
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing:
      "1.3px",
    color: "#999",
  },

  adminIdentityEmail: {
    fontSize: "10px",
    fontWeight: "700",
    marginTop: "2px",
  },

  headerButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    color: "#111",
    borderRadius:
      "11px",
    padding:
      "10px 13px",
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  notificationWrapper: {
    position: "relative",
  },

  notificationButton: {
    width: "42px",
    height: "42px",
    border:
      "1px solid #ddd",
    background: "#fff",
    color: "#111",
    borderRadius:
      "12px",
    fontSize: "18px",
    cursor: "pointer",
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    minWidth: "18px",
    height: "18px",
    padding:
      "0 5px",
    borderRadius:
      "999px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontSize: "8px",
    fontWeight: "900",
    border:
      "2px solid #f4f4f2",
  },

  notificationPanel: {
    position: "absolute",
    right: 0,
    top: "51px",
    width: "310px",
    background: "#fff",
    border:
      "1px solid #ddd",
    borderRadius:
      "17px",
    boxShadow:
      "0 20px 60px rgba(0,0,0,.16)",
    zIndex: 100,
    overflow: "hidden",
  },

  notificationHeader: {
    padding:
      "15px 16px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    borderBottom:
      "1px solid #eee",
  },

  notificationEyebrow: {
    fontSize: "8px",
    letterSpacing:
      "1.3px",
    color: "#999",
    fontWeight: "900",
    marginBottom: "3px",
  },

  closeNotification: {
    border: "none",
    background:
      "transparent",
    fontSize: "20px",
    color: "#777",
    cursor: "pointer",
  },

  notificationItem: {
    display: "flex",
    gap: "10px",
    padding: "17px",
  },

  notificationDot: {
    width: "8px",
    height: "8px",
    borderRadius:
      "50%",
    background: "#111",
    marginTop: "5px",
    flexShrink: 0,
  },

  notificationText: {
    color: "#777",
    fontSize: "11px",
    lineHeight: "1.5",
    marginTop: "4px",
  },

  reviewButton: {
    width: "100%",
    border: "none",
    borderTop:
      "1px solid #eee",
    background: "#f7f7f5",
    padding: "12px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  noNotification: {
    textAlign: "center",
    padding:
      "28px 20px",
    color: "#777",
    fontSize: "11px",
  },

  noNotificationIcon: {
    width: "36px",
    height: "36px",
    margin:
      "0 auto 9px",
    borderRadius:
      "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontWeight: "900",
  },

  hero: {
    background:
      "linear-gradient(135deg,#0b0b0b,#202020)",
    color: "#fff",
    borderRadius:
      "28px",
    padding:
      "38px 38px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "30px",
    marginBottom:
      "15px",
    boxShadow:
      "0 18px 50px rgba(0,0,0,.12)",
  },

  heroEyebrow: {
    fontSize: "9px",
    letterSpacing:
      "2px",
    color: "#999",
    fontWeight: "900",
    marginBottom:
      "12px",
  },

  heroTitle: {
    margin: 0,
    fontSize:
      "clamp(30px,5vw,48px)",
    lineHeight: "1.02",
    letterSpacing:
      "-2px",
  },

  heroText: {
    color: "#aaa",
    margin:
      "13px 0 0",
    maxWidth: "570px",
    fontSize: "13px",
    lineHeight: "1.65",
  },

  heroRight: {
    minWidth: "150px",
    textAlign: "right",
  },

  liveBadge: {
    display: "inline-flex",
    alignItems:
      "center",
    gap: "7px",
    padding:
      "7px 10px",
    border:
      "1px solid #444",
    borderRadius:
      "999px",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing:
      "1px",
    color: "#ccc",
  },

  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius:
      "50%",
    background: "#fff",
  },

  heroTotal: {
    marginTop: "20px",
    fontSize: "42px",
    fontWeight: "900",
    letterSpacing:
      "-2px",
  },

  heroTotalLabel: {
    color: "#777",
    fontSize: "8px",
    letterSpacing:
      "1.4px",
    fontWeight: "900",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(155px,1fr))",
    gap: "10px",
    marginBottom:
      "15px",
  },

  statCard: {
    background: "#fff",
    border:
      "1px solid #e2e2df",
    borderRadius:
      "17px",
    padding: "17px",
    transition:
      "transform .2s ease",
  },

  statActive: {
    borderColor: "#111",
  },

  statPremium: {
    background:
      "linear-gradient(145deg,#fff,#f5f0e4)",
    borderColor:
      "#d8c79e",
  },

  statTop: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
  },

  statLabel: {
    color: "#777",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing:
      ".3px",
  },

  statIcon: {
    fontSize: "16px",
    fontWeight: "900",
  },

  statValue: {
    marginTop:
      "12px",
    fontSize: "29px",
    fontWeight: "900",
    letterSpacing:
      "-1px",
  },

  statDetail: {
    marginTop:
      "3px",
    color: "#999",
    fontSize: "9px",
  },

  searchPanel: {
    background: "#fff",
    border:
      "1px solid #e2e2df",
    borderRadius:
      "20px",
    padding: "16px",
    marginBottom:
      "15px",
  },

  searchHeader: {
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    marginBottom:
      "12px",
  },

  searchEyebrow: {
    fontSize: "8px",
    letterSpacing:
      "1.4px",
    color: "#999",
    fontWeight: "900",
  },

  searchTitle: {
    fontSize: "15px",
    fontWeight: "900",
    marginTop: "3px",
  },

  resultCount: {
    fontSize: "10px",
    color: "#888",
  },

  searchBox: {
    height: "45px",
    background:
      "#f6f6f4",
    border:
      "1px solid #e6e6e3",
    borderRadius:
      "12px",
    display: "flex",
    alignItems:
      "center",
    padding:
      "0 12px",
  },

  searchIcon: {
    color: "#777",
    fontSize: "19px",
    marginRight: "8px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background:
      "transparent",
    fontSize: "12px",
    color: "#111",
  },

  clearSearch: {
    border: "none",
    background:
      "transparent",
    color: "#888",
    fontSize: "18px",
    cursor: "pointer",
  },

  filterRow: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    marginTop:
      "11px",
  },

  filterButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    color: "#555",
    borderRadius:
      "999px",
    padding:
      "7px 9px",
    fontSize: "9px",
    fontWeight: "800",
    cursor: "pointer",
    display: "inline-flex",
    alignItems:
      "center",
    gap: "6px",
  },

  filterButtonActive: {
    background: "#111",
    color: "#fff",
    borderColor: "#111",
  },

  filterCount: {
    background:
      "#f0f0ed",
    color: "#777",
    borderRadius:
      "999px",
    padding:
      "2px 5px",
    fontSize: "8px",
  },

  filterCountActive: {
    background:
      "#333",
    color: "#fff",
  },

  errorBox: {
    marginBottom:
      "15px",
    padding: "16px",
    borderRadius:
      "16px",
    background: "#fff",
    border:
      "1px solid #ddd",
    display: "flex",
    gap: "11px",
    color: "#555",
    fontSize: "11px",
    lineHeight: "1.6",
  },

  errorIcon: {
    width: "27px",
    height: "27px",
    borderRadius:
      "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontWeight: "900",
    flexShrink: 0,
  },

  errorText: {
    marginTop: "2px",
    color: "#888",
  },

  retryButton: {
    marginTop:
      "8px",
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius:
      "8px",
    padding:
      "7px 10px",
    fontSize: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  loadingBox: {
    background: "#fff",
    border:
      "1px solid #e2e2df",
    borderRadius:
      "20px",
    padding:
      "65px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection:
      "column",
    alignItems: "center",
    color: "#777",
    fontSize: "11px",
    gap: "5px",
  },

  loadingOrb: {
    width: "28px",
    height: "28px",
    borderRadius:
      "50%",
    border:
      "3px solid #ddd",
    borderTopColor:
      "#111",
    marginBottom:
      "8px",
  },

  panel: {
    background: "#fff",
    border:
      "1px solid #e2e2df",
    borderRadius:
      "23px",
    overflow: "hidden",
    marginBottom:
      "15px",
  },

  panelHeader: {
    padding:
      "23px 24px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "20px",
    borderBottom:
      "1px solid #eee",
  },

  panelEyebrow: {
    fontSize: "8px",
    letterSpacing:
      "1.5px",
    fontWeight: "900",
    color: "#999",
    marginBottom:
      "6px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "22px",
    letterSpacing:
      "-.5px",
  },

  panelDescription: {
    color: "#888",
    fontSize: "11px",
    margin:
      "6px 0 0",
  },

  panelCounter: {
    background:
      "#f1f1ee",
    borderRadius:
      "999px",
    padding:
      "8px 10px",
    fontSize: "15px",
    fontWeight: "900",
    whiteSpace:
      "nowrap",
  },

  panelCounterDark: {
    background: "#111",
    color: "#fff",
    borderRadius:
      "999px",
    padding:
      "8px 10px",
    fontSize: "15px",
    fontWeight: "900",
    whiteSpace:
      "nowrap",
  },

  userList: {
    display: "flex",
    flexDirection:
      "column",
  },

  userCard: {
    padding:
      "18px 24px",
    borderBottom:
      "1px solid #eee",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "20px",
  },

  premiumUserCard: {
    background:
      "linear-gradient(90deg,#fffdf8,#fff)",
  },

  userMain: {
    display: "flex",
    alignItems:
      "flex-start",
    gap: "13px",
    minWidth: 0,
  },

  avatar: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    borderRadius:
      "13px",
    background:
      "linear-gradient(145deg,#111,#333)",
    color: "#fff",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontSize: "14px",
    fontWeight: "900",
  },

  premiumAvatar: {
    background:
      "linear-gradient(145deg,#171717,#6d5a2e)",
  },

  userInfo: {
    minWidth: 0,
  },

  userNameRow: {
    display: "flex",
    alignItems:
      "center",
    gap: "6px",
    flexWrap: "wrap",
  },

  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "900",
  },

  email: {
    color: "#444",
    fontSize: "11px",
    marginTop: "3px",
    wordBreak:
      "break-word",
  },

  userMetaRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    color: "#888",
    fontSize: "9px",
    marginTop: "5px",
  },

  accountDetails: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "8px",
  },

  infoItem: {
    display: "flex",
    flexDirection:
      "column",
    gap: "2px",
  },

  infoItemLabel: {
    fontSize: "8px",
    color: "#aaa",
  },

  subscriptionRow: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
    marginTop: "7px",
    color: "#8a7540",
    fontSize: "8px",
    fontWeight: "800",
  },

  requested: {
    color: "#aaa",
    fontSize: "9px",
    marginTop: "6px",
  },

  badge: {
    borderRadius:
      "999px",
    padding:
      "4px 7px",
    fontSize: "8px",
    fontWeight: "900",
  },

  pendingBadge: {
    background:
      "#f0f0ed",
    color: "#555",
  },

  approvedBadge: {
    background:
      "#e7e7e3",
    color: "#111",
  },

  rejectedBadge: {
    background:
      "#f1f1ef",
    color: "#777",
  },

  bannedBadge: {
    background: "#111",
    color: "#fff",
  },

  premiumBadge: {
    background:
      "#eadfbe",
    color: "#695522",
    border:
      "1px solid #d9c793",
    borderRadius:
      "999px",
    padding:
      "4px 7px",
    fontSize: "8px",
    fontWeight: "900",
  },

  demoBadge: {
    background:
      "#eeeae0",
    color: "#77705d",
    border:
      "1px solid #ddd7c7",
    borderRadius:
      "999px",
    padding:
      "4px 7px",
    fontSize: "8px",
    fontWeight: "900",
  },

  actions: {
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "flex-end",
    gap: "7px",
    flexShrink: 0,
    flexWrap: "wrap",
  },

  approveButton: {
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius:
      "9px",
    padding:
      "9px 12px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  cancelButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    color: "#444",
    borderRadius:
      "9px",
    padding:
      "9px 12px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  removeButton: {
    border:
      "1px solid #d8d8d5",
    background: "#fff",
    color: "#333",
    borderRadius:
      "9px",
    padding:
      "9px 12px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  blockButton: {
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius:
      "9px",
    padding:
      "9px 12px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  unblockButton: {
    border:
      "1px solid #111",
    background: "#fff",
    color: "#111",
    borderRadius:
      "9px",
    padding:
      "9px 12px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  emptyState: {
    padding:
      "55px 25px",
    textAlign:
      "center",
    color: "#777",
  },

  emptyIcon: {
    width: "43px",
    height: "43px",
    margin:
      "0 auto 11px",
    borderRadius:
      "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontWeight: "900",
  },

  emptyTitle: {
    margin:
      "0 0 5px",
    color: "#111",
    fontSize: "15px",
  },

  emptyText: {
    margin: 0,
    fontSize: "11px",
  },

  premiumOverview: {
    background:
      "linear-gradient(135deg,#171717,#292929)",
    color: "#fff",
    borderRadius:
      "23px",
    padding:
      "25px",
    marginBottom:
      "15px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "20px",
  },

  premiumEyebrow: {
    fontSize: "8px",
    letterSpacing:
      "1.6px",
    color: "#b9a976",
    fontWeight: "900",
  },

  premiumTitle: {
    margin:
      "6px 0 0",
    fontSize: "23px",
    letterSpacing:
      "-.5px",
  },

  premiumDescription: {
    margin:
      "7px 0 0",
    color: "#aaa",
    fontSize: "10px",
  },

  premiumNumbers: {
    display: "flex",
    gap: "20px",
  },

  premiumNumbers: {
    display: "flex",
    gap: "18px",
  },

  securityCard: {
    display: "flex",
    gap: "13px",
    alignItems:
      "center",
    background: "#111",
    color: "#fff",
    borderRadius:
      "18px",
    padding: "17px 19px",
    marginBottom:
      "18px",
  },

  securityIcon: {
    width: "28px",
    height: "28px",
    flexShrink: 0,
    borderRadius:
      "50%",
    background: "#fff",
    color: "#111",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontWeight: "900",
  },

  securityText: {
    margin:
      "4px 0 0",
    color: "#aaa",
    fontSize: "9px",
    lineHeight: "1.5",
  },

  securityStatus: {
    marginLeft: "auto",
    border:
      "1px solid #444",
    color: "#aaa",
    borderRadius:
      "999px",
    padding:
      "5px 8px",
    fontSize: "7px",
    fontWeight: "900",
    letterSpacing:
      "1px",
  },

  footer: {
    padding:
      "20px 3px",
    display: "flex",
    justifyContent:
      "space-between",
    gap: "10px",
    flexWrap: "wrap",
    color: "#999",
    fontSize: "9px",
    fontWeight: "700",
  },
};
