"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);

  // Live platform overview loaded from the server-authorized overview API.
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [overviewUpdatedAt, setOverviewUpdatedAt] = useState(null);

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

  // Content upload form state
  const [contentFile, setContentFile] = useState(null);
  const [contentTitle, setContentTitle] = useState("");
  const [contentCategory, setContentCategory] = useState("Study Material");
  const [contentUploading, setContentUploading] = useState(false);
  const [contentUploadMessage, setContentUploadMessage] = useState("");

  // Persistent Study Material content manager
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryFolders, setLibraryFolders] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryActionBusy, setLibraryActionBusy] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [libraryMessage, setLibraryMessage] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");


  // The Hindu newspaper extraction workflow
  const [hinduPdf, setHinduPdf] = useState(null);
  const [hinduDate, setHinduDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  const [hinduBusy, setHinduBusy] = useState(false);
  const [hinduMessage, setHinduMessage] = useState("");
  const [hinduResults, setHinduResults] = useState(null);

  /* =========================================================
     ADMIN OVERVIEW API
  ========================================================= */

  async function loadOverview(silent = false) {
    try {
      if (!silent) setOverviewLoading(true);
      setOverviewError("");

      const response = await fetch("/api/admin/overview", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.error || "Overview load nahi ho paya.");
      }

      setOverview(data);
      setOverviewUpdatedAt(new Date());
    } catch (err) {
      console.error("Admin overview error:", err);
      setOverviewError(err.message || "Overview unavailable.");
    } finally {
      setOverviewLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();

    const interval = setInterval(() => {
      loadOverview(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadContentLibrary();
  }, []);

  /* =========================================================
     AUTO REFRESH
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

      const nextUsers = Array.isArray(data.users)
        ? data.users
        : [];

      const nextPendingCount =
        nextUsers.filter(
          (user) => user.status === "pending"
        ).length;

      if (
        lastPendingCount !== null &&
        nextPendingCount > lastPendingCount
      ) {
        const difference =
          nextPendingCount - lastPendingCount;

        setNotificationCount(
          (previous) =>
            previous + difference
        );

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("SAMBHAV UPSC", {
            body:
              `${difference} new access request` +
              (difference > 1 ? "s" : "") +
              " received.",
          });
        }
      }

      setLastPendingCount(nextPendingCount);
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
     NOTIFICATIONS
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

  /* =========================================================
     PREMIUM
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
     FILTER + SEARCH
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
        String(user.first_name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.email || "")
          .toLowerCase()
          .includes(query) ||
        String(user.username || "")
          .toLowerCase()
          .includes(query) ||
        String(user.telegram_id || "")
          .includes(query) ||
        String(user.id || "")
          .toLowerCase()
          .includes(query) ||
        String(user.order_id || "")
          .toLowerCase()
          .includes(query) ||
        String(user.payment_id || "")
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

  const dateForAdmin = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable";

  async function handleContentUpload(event) {
    event.preventDefault();

    // Keep a stable reference: React may clear currentTarget after the handler returns.
    const form = event.currentTarget;
    const file = contentFile;
    const title = contentTitle.trim();

    if (!title || !file) {
      setContentUploadMessage("Please add a title and choose a file.");
      return;
    }

    const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
    if (file.size <= 0) {
      setContentUploadMessage("The selected file is empty.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setContentUploadMessage("File size must be 50 MB or less.");
      return;
    }

    setContentUploading(true);
    setContentUploadMessage("Preparing secure upload…");

    try {
      // Ask the server to authenticate this admin and create a short-lived
      // Supabase Storage signed-upload URL. File bytes do not pass through Vercel.
      const signResponse = await fetch("/api/admin/content-upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign",
          fileName: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      const signResult = await signResponse.json().catch(() => ({}));
      if (!signResponse.ok || signResult.success !== true || !signResult.uploadUrl || !signResult.path) {
        throw new Error(signResult.error || "Could not prepare the secure upload.");
      }

      setContentUploadMessage("Uploading file to secure storage…");

      // Upload directly from the browser to Supabase Storage.
      const storageResponse = await fetch(signResult.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          apikey: signResult.anonKey,
          "x-upsert": "false",
        },
        body: file,
      });

      if (!storageResponse.ok) {
        const detail = await storageResponse.text().catch(() => "");
        throw new Error(
          `Storage upload failed (${storageResponse.status}). ${detail.slice(0, 250)}`
        );
      }

      setContentUploadMessage("Saving Study Material details…");

      const finalizeResponse = await fetch("/api/admin/content-upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          title,
          category: contentCategory,
          path: signResult.path,
          bucket: signResult.bucket,
          fileName: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      const finalizeResult = await finalizeResponse.json().catch(() => ({}));
      if (!finalizeResponse.ok || finalizeResult.success !== true) {
        throw new Error(
          finalizeResult.error ||
          "File uploaded, but Study Material details could not be saved."
        );
      }

      setContentUploadMessage(
        `Upload successful. Storage path: ${finalizeResult.path || signResult.path}`
      );
      setContentFile(null);
      setContentTitle("");
      form?.reset();
    } catch (err) {
      setContentUploadMessage(err.message || "Content upload failed.");
    } finally {
      setContentUploading(false);
    }
  }

  async function loadContentLibrary() {
    setLibraryLoading(true);
    setLibraryMessage("");
    try {
      const response = await fetch("/api/admin/content-upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "list" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(data.error || "Content library could not be loaded.");
      }
      setLibraryItems(Array.isArray(data.items) ? data.items : []);
      setLibraryFolders(Array.isArray(data.folders) ? data.folders : []);
    } catch (err) {
      setLibraryMessage(err.message || "Content library could not be loaded.");
    } finally {
      setLibraryLoading(false);
    }
  }

  async function createContentFolder(event) {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) {
      setLibraryMessage("Enter a folder name first.");
      return;
    }
    setLibraryActionBusy(true);
    setLibraryMessage("");
    try {
      const response = await fetch("/api/admin/content-upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-folder", name }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(data.error || "Folder could not be created.");
      }
      setNewFolderName("");
      setLibraryMessage(`Folder “${data.name}” created in Supabase Storage.`);
      await loadContentLibrary();
    } catch (err) {
      setLibraryMessage(err.message || "Folder could not be created.");
    } finally {
      setLibraryActionBusy(false);
    }
  }

  async function deleteContentItem(item) {
    if (!item?.id) return;
    const confirmed = window.confirm(
      `Delete “${item.title || "this content"}” from the Study Material library? This removes its database record and attempts to remove its stored file. This cannot be undone.`
    );
    if (!confirmed) return;
    setLibraryActionBusy(true);
    setLibraryMessage("");
    try {
      const response = await fetch("/api/admin/content-upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-content", id: item.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(data.error || "Content could not be deleted.");
      }
      setLibraryMessage(data.warning || `Deleted “${item.title || "content"}”.`);
      await loadContentLibrary();
    } catch (err) {
      setLibraryMessage(err.message || "Content could not be deleted.");
    } finally {
      setLibraryActionBusy(false);
    }
  }

  async function handleTheHinduExtraction(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = hinduPdf;
    const date = hinduDate;
    if (!file || !date) {
      setHinduMessage("The Hindu PDF aur newspaper date select karo.");
      return;
    }
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setHinduMessage("Please select a PDF newspaper file.");
      return;
    }
    if (!file.size || file.size > 50 * 1024 * 1024) {
      setHinduMessage("PDF size 50 MB se zyada nahi hona chahiye.");
      return;
    }

    setHinduBusy(true);
    setHinduMessage("Secure upload URL prepare ho raha hai…");
    setHinduResults(null);
    try {
      const signResponse = await fetch("/api/admin/content-upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign", fileName: file.name, size: file.size, contentType: file.type || "application/pdf" }),
      });
      const sign = await signResponse.json().catch(() => ({}));
      if (!signResponse.ok || sign.success !== true || !sign.uploadUrl || !sign.path) {
        throw new Error(sign.error || "Secure PDF upload could not be prepared.");
      }

      setHinduMessage("PDF secure storage par upload ho rahi hai…");
      const uploadResponse = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf", apikey: sign.anonKey, "x-upsert": "false" },
        body: file,
      });
      if (!uploadResponse.ok) {
        const detail = await uploadResponse.text().catch(() => "");
        throw new Error(`PDF upload failed (${uploadResponse.status}). ${detail.slice(0, 220)}`);
      }

      setHinduMessage("PDF extract ho rahi hai aur UPSC-relevant articles process ho rahe hain. Ismein kuch minute lag sakte hain…");
      const processResponse = await fetch("/api/admin/the-hindu-extract", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process", path: sign.path, bucket: sign.bucket, date, fileName: file.name }),
      });
      const result = await processResponse.json().catch(() => ({}));
      if (!processResponse.ok || result.success !== true) throw new Error(result.error || "The Hindu extraction failed.");
      setHinduResults(result);
      setHinduMessage(`Extraction complete — ${result.published || 0} published, ${result.skipped || 0} duplicates skipped, ${result.failed || 0} failed.`);
      setHinduPdf(null);
      form?.reset();
    } catch (error) {
      setHinduMessage(error?.message || "The Hindu extraction failed.");
    } finally {
      setHinduBusy(false);
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main style={styles.page}>
      <style jsx global>{`
        .sambhav-page { color: #f5f2eb !important; }
        .sambhav-page [style*="background: #fff"], .sambhav-page [style*="background: "#fff"], .sambhav-page [style*="backgroundColor: #fff"], .sambhav-page [style*="background: #f7f"], .sambhav-page [style*="background: #f6f"] { background: #151515 !important; color: #f5f2eb !important; border-color: rgba(199,168,93,.22) !important; }
        .sambhav-page input, .sambhav-page select, .sambhav-page textarea { background-color: #111 !important; color: #f5f2eb !important; border-color: rgba(199,168,93,.3) !important; color-scheme: dark; }
        .sambhav-page input::placeholder, .sambhav-page textarea::placeholder { color: #918a7d !important; }
        .sambhav-page button { transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease; }
        .sambhav-page button:hover { border-color: rgba(199,168,93,.65) !important; }
        .sambhav-page .sambhav-content-upload { background: linear-gradient(145deg,#171717,#101010) !important; border-color: rgba(199,168,93,.28) !important; box-shadow: 0 16px 40px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.025) !important; }
        @media (max-width: 760px) {
          .sambhav-content-upload { padding: 16px !important; }
          .sambhav-content-upload form { grid-template-columns: minmax(0, 1fr) !important; }
          .sambhav-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .sambhav-header-right {
            width: 100% !important;
            justify-content: flex-start !important;
          }

          .sambhav-hero {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 28px 22px !important;
          }

          .sambhav-hero-right {
            width: 100% !important;
            text-align: left !important;
          }

          .sambhav-panel-header {
            padding: 20px 16px !important;
          }

          .sambhav-user-card {
            padding: 18px 14px !important;
          }

          .sambhav-account-details {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .sambhav-subscription-box {
            grid-template-columns:
              1fr !important;
          }

          .sambhav-user-card-actions {
            justify-content: stretch !important;
          }

          .sambhav-user-card-actions button {
            flex: 1 !important;
            min-height: 42px !important;
          }

          .sambhav-premium-overview {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .sambhav-premium-numbers {
            width: 100% !important;
            justify-content: space-between !important;
          }
        }

        @media (max-width: 480px) {
          .sambhav-page {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .sambhav-hero-title {
            font-size: 34px !important;
          }

          .sambhav-stats-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .sambhav-user-identity {
            gap: 10px !important;
          }

          .sambhav-user-name {
            font-size: 13px !important;
          }

          .sambhav-info-item {
            padding: 10px !important;
          }

          .sambhav-info-value {
            font-size: 11px !important;
          }

          .sambhav-panel-title {
            font-size: 20px !important;
          }
        }

        /* Compact premium live overview */
        .sambhav-overview {
          margin: 0 0 26px;
          padding: 22px;
          background: #fff;
          border: 1px solid #e8e6df;
          border-radius: 22px;
          box-shadow: 0 8px 28px rgba(20, 22, 25, .035);
          color: #171717;
        }
        .sambhav-overview-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        .sambhav-overview-eyebrow {
          margin-bottom: 7px;
          color: #8c867b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }
        .sambhav-overview-title {
          margin: 0;
          font-size: clamp(22px, 2.8vw, 29px);
          line-height: 1.15;
          letter-spacing: -.8px;
          font-weight: 780;
        }
        .sambhav-overview-subtitle {
          margin: 6px 0 0;
          color: #77746e;
          font-size: 12px;
          line-height: 1.5;
        }
        .sambhav-overview-refresh {
          flex-shrink: 0;
          padding: 10px 13px;
          border: 1px solid #e4e1d9;
          border-radius: 11px;
          background: #fff;
          color: #171717;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }
        .sambhav-overview-refresh:disabled {
          opacity: .55;
          cursor: wait;
        }
        .sambhav-overview-status {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px 12px;
          margin-bottom: 12px;
          border: 1px solid #e6e9e0;
          border-radius: 11px;
          background: #fafbf7;
          color: #466747;
          font-size: 11px;
        }
        .sambhav-overview-live-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #26955b;
        }
        .sambhav-overview-updated {
          margin-left: auto;
          color: #898780;
          font-size: 10px;
        }
        .sambhav-overview-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }
        .sambhav-overview-metric {
          min-width: 0;
          padding: 14px;
          border: 1px solid #e9e7e0;
          border-radius: 14px;
          background: #fff;
        }
        .sambhav-overview-metric-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #66635d;
          font-size: 11px;
          font-weight: 700;
        }
        .sambhav-overview-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 3px;
        }
        .sambhav-overview-dot.blue { background: #4786db; }
        .sambhav-overview-dot.amber { background: #d49a35; }
        .sambhav-overview-dot.green { background: #299966; }
        .sambhav-overview-dot.red { background: #d65c55; }
        .sambhav-overview-dot.purple { background: #8863c9; }
        .sambhav-overview-number {
          display: block;
          margin: 14px 0 6px;
          font-size: clamp(24px, 2.5vw, 30px);
          line-height: 1;
          font-weight: 780;
          letter-spacing: -.8px;
          font-variant-numeric: tabular-nums;
        }
        .sambhav-overview-note {
          margin: 0;
          color: #8a8881;
          font-size: 10px;
          line-height: 1.5;
        }
        .sambhav-overview-content-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        .sambhav-overview-content-card {
          padding: 14px 15px;
          border: 1px solid #e9e7e0;
          border-radius: 14px;
          background: #faf9f6;
        }
        .sambhav-overview-content-label {
          color: #65625c;
          font-size: 11px;
          font-weight: 700;
        }
        .sambhav-overview-content-number {
          display: block;
          margin: 8px 0 4px;
          font-size: 24px;
          font-weight: 780;
          letter-spacing: -.6px;
        }
        .sambhav-overview-error {
          padding: 11px 12px;
          margin-bottom: 12px;
          border: 1px solid #f0d3cd;
          border-radius: 11px;
          background: #fff7f5;
          color: #9e392f;
          font-size: 11px;
          line-height: 1.5;
        }
        .sambhav-overview-error button {
          margin-left: 8px;
          padding: 5px 8px;
          border: 1px solid #e7c6c0;
          border-radius: 7px;
          background: #fff;
          cursor: pointer;
        }
        .sambhav-overview-warning {
          margin: 11px 0 0;
          color: #8a6a2b;
          font-size: 10px;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .sambhav-overview-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 600px) {
          .sambhav-overview {
            padding: 15px;
            border-radius: 18px;
            margin-bottom: 20px;
          }
          .sambhav-overview-heading {
            align-items: flex-start;
          }
          .sambhav-overview-title {
            font-size: 24px;
          }
          .sambhav-overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .sambhav-overview-metric {
            padding: 12px;
            border-radius: 12px;
          }
          .sambhav-overview-content-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .sambhav-overview-updated {
            width: 100%;
            margin-left: 15px;
          }
        }

        .sambhav-command-center { margin: 18px 0 24px; }
        .sambhav-command-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .sambhav-command-panel { min-width:0; background:#fff; border:1px solid #e7eaf0; border-radius:17px; padding:19px; box-shadow:0 5px 20px rgba(22,31,50,.035); }
        .sambhav-command-panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:17px; }
        .sambhav-command-panel-head h3 { margin:0; color:#171c28; font-size:14px; letter-spacing:-.2px; }
        .sambhav-command-panel-head p { margin:5px 0 0; color:#858b98; font-size:10px; }
        .sambhav-panel-icon { display:grid; place-items:center; width:34px; height:34px; border-radius:11px; background:#f5f0e4; color:#9a783a; font-size:18px; }
        .sambhav-donut-layout { display:flex; align-items:center; justify-content:center; gap:clamp(15px,3vw,35px); padding:7px 0 4px; }
        .sambhav-donut { width:145px; height:145px; flex:0 0 145px; display:grid; place-items:center; border-radius:50%; position:relative; background:conic-gradient(#25ad7c 0 var(--approved),#f0b33c var(--approved) calc(var(--approved) + var(--pending)),#e75c67 calc(var(--approved) + var(--pending)) 100%); }
        .sambhav-account-donut { background:conic-gradient(#8250d8 0 var(--premium),#438ce8 var(--premium) calc(var(--premium) + var(--free)),#efb43d calc(var(--premium) + var(--free)) 100%); }
        .sambhav-donut:before { content:""; position:absolute; inset:12px; border-radius:50%; background:#fff; }
        .sambhav-donut>div { position:relative; z-index:1; text-align:center; }
        .sambhav-donut strong { display:block; color:#171c28; font-size:24px; font-weight:850; }
        .sambhav-donut small { display:block; color:#858b98; font-size:9px; margin-top:3px; }
        .sambhav-legend { display:grid; gap:13px; min-width:125px; flex:1; }
        .sambhav-legend>div { display:grid; grid-template-columns:9px minmax(50px,1fr) auto; align-items:center; gap:8px; color:#5d6472; font-size:10px; }
        .sambhav-legend i { width:8px; height:8px; border-radius:50%; display:block; }
        .sambhav-legend b { color:#242a36; font-size:11px; }
        .approved-dot { background:#25ad7c; } .pending-dot { background:#f0b33c; } .blocked-dot { background:#e75c67; }
        .premium-dot { background:#8250d8; } .free-dot { background:#438ce8; } .demo-dot { background:#efb43d; }
        .sambhav-command-link { border:1px solid #e4e7ed; background:#fff; border-radius:9px; padding:8px 10px; color:#80612d; font-size:10px; font-weight:750; cursor:pointer; }
        .sambhav-activity-list { display:grid; }
        .sambhav-activity-item { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid #eff1f4; min-width:0; }
        .sambhav-activity-item:last-child { border-bottom:0; }
        .sambhav-activity-symbol { display:grid; place-items:center; width:34px; height:34px; flex:0 0 34px; border-radius:11px; background:#edf6ef; color:#3b9b67; font-size:16px; }
        .sambhav-activity-item>div { min-width:0; flex:1; }
        .sambhav-activity-item strong,.sambhav-activity-item small { display:block; overflow-wrap:anywhere; }
        .sambhav-activity-item strong { color:#252b37; font-size:10px; }
        .sambhav-activity-item small { color:#858b98; font-size:9px; margin-top:4px; }
        .sambhav-activity-status { border-radius:20px; padding:5px 7px; background:#eef1f5; color:#626b7a; font-size:8px; font-weight:750; }
        .sambhav-activity-status.approved { background:#e6f7ed; color:#238254; }
        .sambhav-activity-status.pending { background:#fff4d9; color:#956b1c; }
        .sambhav-activity-status.banned,.sambhav-activity-status.rejected { background:#fdebea; color:#ad4545; }
        .sambhav-empty-activity { padding:20px 0; color:#858b98; font-size:10px; }
        .sambhav-quick-actions { display:grid; gap:8px; }
        .sambhav-quick-actions button { display:flex; align-items:center; gap:11px; width:100%; border:1px solid #eceef2; background:#fff; border-radius:11px; padding:12px; text-align:left; cursor:pointer; transition:background .15s,border-color .15s,transform .15s; }
        .sambhav-quick-actions button:hover { background:#fbfaf6; border-color:#dfd0ac; transform:translateY(-1px); }
        .sambhav-quick-actions button span { width:29px; height:29px; display:grid; place-items:center; border-radius:9px; background:#f5f0e4; color:#927039; font-size:15px; }
        .sambhav-quick-actions button b { flex:1; color:#272d39; font-size:10px; }
        .sambhav-quick-actions button i { font-style:normal; color:#858b98; font-size:20px; }
        @media(max-width:850px) { .sambhav-command-grid { grid-template-columns:minmax(0,1fr); } }
        @media(max-width:520px) { .sambhav-command-panel { padding:14px; } .sambhav-donut-layout { gap:14px; } .sambhav-donut { width:118px; height:118px; flex-basis:118px; } .sambhav-donut:before { inset:10px; } .sambhav-legend { min-width:110px; } }

        /* SAMBHAV dashboard-aligned polish: compact records, accessible controls, responsive metrics. */
        .sambhav-page button, .sambhav-page input, .sambhav-page select, .sambhav-page textarea { font: inherit; }
        .sambhav-page button { transition: transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease; }
        .sambhav-page button:not(:disabled):hover { transform: translateY(-1px); }
        .sambhav-page button:focus-visible, .sambhav-page input:focus-visible, .sambhav-page select:focus-visible, .sambhav-page textarea:focus-visible { outline: 3px solid rgba(160,125,50,.34); outline-offset: 2px; }
        .sambhav-overview { background: rgba(255,253,249,.94) !important; border-color: #e5dece !important; box-shadow: 0 12px 34px rgba(42,35,20,.055) !important; }
        .sambhav-overview-metric, .sambhav-overview-content-card { background: #fffdf9 !important; border-color: #e9e2d3 !important; }
        .sambhav-overview-dot.purple { background: #a58a4a !important; }
        .sambhav-overview-dot.blue { background: #9c8a64 !important; }
        .sambhav-overview-dot.green { background: #64856c !important; }
        .sambhav-overview-dot.red { background: #b87568 !important; }
        .sambhav-overview-dot.amber { background: #c7a85d !important; }
        .sambhav-user-card-actions button { min-height: 36px; padding: 8px 12px !important; border-radius: 10px !important; font-size: 12px !important; }
        .sambhav-account-details { gap: 8px !important; }
        .sambhav-info-item { min-width: 0; border-radius: 10px !important; }
        .sambhav-content-upload { border: 1px solid #e5dece !important; box-shadow: 0 12px 34px rgba(42,35,20,.045); }
        .sambhav-command-panel { border-color: #e5dece !important; box-shadow: 0 8px 24px rgba(42,35,20,.035); }
        @media (max-width: 900px) {
          .sambhav-overview-grid { grid-template-columns: repeat(3,minmax(0,1fr)) !important; }
          .sambhav-overview-content-grid { grid-template-columns: repeat(3,minmax(0,1fr)) !important; }
        }
        @media (max-width: 600px) {
          .sambhav-overview { padding: 15px !important; border-radius: 17px !important; }
          .sambhav-overview-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          .sambhav-overview-content-grid { grid-template-columns: 1fr !important; }
          .sambhav-overview-heading { align-items: flex-start !important; }
          .sambhav-overview-updated { margin-left: 0 !important; width: 100%; }
          .sambhav-user-card-actions { gap: 8px !important; }
        }

            
        /* Compact, responsive user cards — scoped to this admin page */
        .sambhav-page .sambhav-compact-user-card {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          padding: 12px 14px !important;
          margin: 0 0 10px;
          border: 1px solid #e5dece !important;
          border-radius: 14px !important;
          background: #fffdf9 !important;
          color: #24231f !important;
          box-shadow: 0 3px 12px rgba(36, 30, 17, .045);
          transition: border-color .16s ease, box-shadow .16s ease;
        }
        .sambhav-page .sambhav-compact-user-card:hover {
          border-color: #c7a85d !important;
          box-shadow: 0 7px 18px rgba(36, 30, 17, .07);
        }
        .sambhav-page .sambhav-compact-user-card.sambhav-premium-user-card {
          border-color: #d5bd80 !important;
          background: linear-gradient(135deg, #fffdf6, #fff) !important;
        }
        .sambhav-page .sambhav-compact-user-card.sambhav-blocked-user-card {
          border-color: #e7ceca !important;
        }
        .sambhav-page .sambhav-compact-user-content {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 12px !important;
          width: 100%;
          min-width: 0;
        }
        .sambhav-page .sambhav-compact-user-card .sambhav-user-identity {
          flex: 1 1 220px;
          min-width: 0 !important;
          gap: 10px !important;
        }
        .sambhav-page .sambhav-compact-user-card .sambhav-user-name {
          font-size: 13px !important;
          line-height: 1.4 !important;
          overflow-wrap: anywhere;
        }
        .sambhav-page .sambhav-compact-user-actions {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          flex: 0 0 auto;
          flex-wrap: wrap;
          gap: 7px !important;
          min-width: 0;
        }
        .sambhav-page .sambhav-compact-user-actions button {
          min-height: 32px !important;
          padding: 7px 10px !important;
          border-radius: 8px !important;
          font-size: 11px !important;
          line-height: 1.25;
          font-weight: 650;
          white-space: nowrap;
        }
        .sambhav-page .sambhav-compact-user-actions button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }
        @media (max-width: 760px) {
          .sambhav-page .sambhav-compact-user-card {
            padding: 11px !important;
            border-radius: 12px !important;
          }
          .sambhav-page .sambhav-compact-user-content {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .sambhav-page .sambhav-compact-user-card .sambhav-user-identity {
            flex: 1 1 auto;
            width: 100%;
          }
          .sambhav-page .sambhav-compact-user-actions {
            width: 100%;
            justify-content: stretch !important;
          }
          .sambhav-page .sambhav-compact-user-actions button {
            flex: 1 1 0;
            min-width: 0;
            white-space: normal;
          }
        }

            `}</style>

      <div
        style={styles.container}
        className="sambhav-page"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <header
          style={styles.header}
          className="sambhav-header"
        >
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
                style={styles.logo}
              >
                S
              </div>

              <div>
                <div
                  style={styles.brand}
                >
                  SAMBHAV UPSC
                </div>

                <div
                  style={styles.subtitle}
                >
                  Administration Center
                </div>
              </div>
            </div>
          </div>

          <div
            style={styles.headerRight}
            className="sambhav-header-right"
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

                          window.scrollTo({
                            top: 600,
                            behavior:
                              "smooth",
                          });
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

            <button
              type="button"
              onClick={() => {
                document.getElementById("admin-content-upload")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              style={styles.contentUploadHeaderButton}
            >
              ↑ Content Upload
            </button>
          </div>
        </header>

        {/* =================================================
            LIVE PLATFORM OVERVIEW
        ================================================= */}

        <section className="sambhav-overview">
          <div className="sambhav-overview-heading">
            <div>
              <div className="sambhav-overview-eyebrow">SAMBHAV / ADMIN</div>
              <h2 className="sambhav-overview-title">Platform Overview</h2>
              <p className="sambhav-overview-subtitle">
                Live counts from the SAMBHAV UPSC database
              </p>
            </div>
            <button
              type="button"
              className="sambhav-overview-refresh"
              onClick={() => loadOverview()}
              disabled={overviewLoading}
            >
              {overviewLoading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {overviewError && (
            <div className="sambhav-overview-error" role="alert">
              {overviewError}
              <button type="button" onClick={() => loadOverview()}>Retry</button>
            </div>
          )}

          <div className="sambhav-overview-status">
            <span className="sambhav-overview-live-dot" />
            <span>{overview ? "Live database counts" : "Connecting to database"}</span>
            {overviewUpdatedAt && (
              <span className="sambhav-overview-updated">
                Updated {overviewUpdatedAt.toLocaleTimeString("en-IN")}
              </span>
            )}
          </div>

          <div className="sambhav-overview-grid">
            {[
              { key: "users", label: "Total Users", note: "Registered accounts", color: "blue" },
              { key: "pending_users", label: "Pending", note: "Awaiting approval", color: "amber" },
              { key: "approved_users", label: "Approved", note: "Approved accounts", color: "green" },
              { key: "banned_users", label: "Blocked", note: "Restricted accounts", color: "red" },
              { key: "subscriptions", label: "Subscriptions", note: "Total records, not active subscribers", color: "purple" },
            ].map((item) => {
              const metric = overview?.metrics?.[item.key];
              return (
                <article className="sambhav-overview-metric" key={item.key}>
                  <div className="sambhav-overview-metric-label">
                    <span className={`sambhav-overview-dot ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  <strong className="sambhav-overview-number">
                    {!metric ? "—" : metric.available === false ? "N/A" : Number(metric.value).toLocaleString("en-IN")}
                  </strong>
                  <p className="sambhav-overview-note">{item.note}</p>
                </article>
              );
            })}
          </div>

          <div className="sambhav-overview-content-grid">
            {[
              { key: "current_affairs_items", label: "Current Affairs", note: "Database items" },
              { key: "mains_evaluations", label: "Mains Evaluations", note: "Saved evaluation records" },
              { key: "prelims_questions", label: "Prelims Questions", note: "Question records" },
            ].map((item) => {
              const metricAliases = {
                current_affairs_items: ["current_affairs_items", "current_affairs"],
                mains_evaluations: ["mains_evaluations", "mains_answer_history"],
                prelims_questions: ["prelims_questions", "prelims_pyqs"],
              };
              const metric = (metricAliases[item.key] || [item.key])
                .map((key) => overview?.metrics?.[key])
                .find((value) => value !== undefined && value !== null);
              return (
                <article className="sambhav-overview-content-card" key={item.key}>
                  <div className="sambhav-overview-content-label">{item.label}</div>
                  <strong className="sambhav-overview-content-number">
                    {!metric ? "—" : metric.available === false ? "N/A" : Number(metric.value).toLocaleString("en-IN")}
                  </strong>
                  <div className="sambhav-overview-note">{item.note}</div>
                </article>
              );
            })}
          </div>

          {overview?.unavailable_metrics?.length > 0 && (
            <p className="sambhav-overview-warning">
              Some metrics are unavailable. Check the API response before relying on those figures.
            </p>
          )}
          <p className="sambhav-overview-warning">
            Counts are database row counts. Subscription records are not the same as active Premium users or verified revenue.
          </p>
        </section>

        {/* =================================================
            ADMIN COMMAND CENTER — DATA-DRIVEN SUMMARY
        ================================================= */}
        <section className="sambhav-command-center" aria-label="Admin command center">
          <div className="sambhav-command-grid">
            <article className="sambhav-command-panel sambhav-status-panel">
              <div className="sambhav-command-panel-head">
                <div><h3>User Status Distribution</h3><p>Based on accounts currently loaded</p></div>
                <span className="sambhav-panel-icon">◷</span>
              </div>
              <div className="sambhav-donut-layout">
                <div className="sambhav-donut sambhav-status-donut"
                  style={{"--approved": `${users.length ? (joinedUsers.length / users.length) * 100 : 0}%`,
                    "--pending": `${users.length ? (pendingUsers.length / users.length) * 100 : 0}%`}}>
                  <div><strong>{users.length}</strong><small>Total users</small></div>
                </div>
                <div className="sambhav-legend">
                  <div><i className="approved-dot"/> <span>Approved</span><b>{joinedUsers.length}</b></div>
                  <div><i className="pending-dot"/> <span>Pending</span><b>{pendingUsers.length}</b></div>
                  <div><i className="blocked-dot"/> <span>Blocked</span><b>{bannedUsers.length}</b></div>
                </div>
              </div>
            </article>

            <article className="sambhav-command-panel sambhav-account-panel">
              <div className="sambhav-command-panel-head">
                <div><h3>Account Types</h3><p>Current account classification</p></div>
                <span className="sambhav-panel-icon">◇</span>
              </div>
              <div className="sambhav-donut-layout">
                <div className="sambhav-donut sambhav-account-donut"
                  style={{"--premium": `${users.length ? (premiumUsers.length / users.length) * 100 : 0}%`,
                    "--free": `${users.length ? (freeUsers.length / users.length) * 100 : 0}%`}}>
                  <div><strong>{users.length}</strong><small>Total users</small></div>
                </div>
                <div className="sambhav-legend">
                  <div><i className="premium-dot"/> <span>Premium</span><b>{premiumUsers.length}</b></div>
                  <div><i className="free-dot"/> <span>Free</span><b>{freeUsers.length}</b></div>
                  <div><i className="demo-dot"/> <span>Demo</span><b>{users.filter(u => u.premium_active && String(u.premium_plan || "").toLowerCase() === "demo").length}</b></div>
                </div>
              </div>
            </article>

            <article className="sambhav-command-panel sambhav-activity-panel">
              <div className="sambhav-command-panel-head">
                <div><h3>Recent Registrations</h3><p>Latest accounts returned by the users API</p></div>
                <button type="button" className="sambhav-command-link" onClick={() => document.getElementById("sambhav-user-directory")?.scrollIntoView({behavior:"smooth"})}>View users →</button>
              </div>
              <div className="sambhav-activity-list">
                {[...users].sort((a,b)=>new Date(b.created_at || 0)-new Date(a.created_at || 0)).slice(0,4).map((u) => (
                  <div className="sambhav-activity-item" key={`recent-${u.id}`}>
                    <span className="sambhav-activity-symbol">♙</span>
                    <div><strong>{u.first_name || u.username || "Unnamed user"}</strong><small>{u.email || "No email"} · {dateForAdmin(u.created_at)}</small></div>
                    <span className={`sambhav-activity-status ${u.status || "unknown"}`}>{u.status || "unknown"}</span>
                  </div>
                ))}
                {users.length === 0 && <div className="sambhav-empty-activity">Registration data will appear here when users load.</div>}
              </div>
            </article>

            <article className="sambhav-command-panel sambhav-quick-panel">
              <div className="sambhav-command-panel-head">
                <div><h3>Quick Actions</h3><p>Shortcuts to existing admin tools</p></div>
                <span className="sambhav-panel-icon">↯</span>
              </div>
              <div className="sambhav-quick-actions">
                <button type="button" onClick={() => document.getElementById("sambhav-user-directory")?.scrollIntoView({behavior:"smooth"})}><span>♙</span><b>Manage Users</b><i>›</i></button>
                <button type="button" onClick={() => document.getElementById("sambhav-subscription-area")?.scrollIntoView({behavior:"smooth"})}><span>♕</span><b>View Subscriptions</b><i>›</i></button>
                <button type="button" onClick={() => document.getElementById("admin-content-upload")?.scrollIntoView({behavior:"smooth"})}><span>▤</span><b>Add Content</b><i>›</i></button>
                <button type="button" onClick={() => document.getElementById("sambhav-analytics-area")?.scrollIntoView({behavior:"smooth"})}><span>▥</span><b>View Analytics</b><i>›</i></button>
              </div>
            </article>
          </div>
        </section>

        {/* =================================================
            HERO
        ================================================= */}

        <section
          style={styles.hero}
          className="sambhav-hero"
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
              style={styles.heroTitle}
              className="sambhav-hero-title"
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
            style={styles.heroRight}
            className="sambhav-hero-right"
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
            CONTENT UPLOAD
        ================================================= */}
        <section
          id="admin-content-upload"
          className="sambhav-content-upload"
          style={styles.contentUploadSection}
        >
          <div style={styles.contentUploadHeader}>
            <div>
              <div style={styles.contentUploadEyebrow}>CONTENT MANAGEMENT</div>
              <h2 style={styles.contentUploadTitle}>Upload Study Content</h2>
              <p style={styles.contentUploadDescription}>
                Upload PDFs, notes, images or other study files directly to secure storage (up to 50 MB).
              </p>
            </div>
            <div style={styles.contentUploadIcon}>↑</div>
          </div>

          <form onSubmit={handleContentUpload} style={styles.contentUploadForm}>
            <label style={styles.contentUploadLabel}>
              Content title
              <input
                type="text"
                value={contentTitle}
                onChange={(event) => setContentTitle(event.target.value)}
                placeholder="e.g. Polity revision notes"
                required
                style={styles.contentUploadInput}
              />
            </label>

            <label style={styles.contentUploadLabel}>
              Category
              <select
                value={contentCategory}
                onChange={(event) => setContentCategory(event.target.value)}
                style={styles.contentUploadInput}
              >
                {[
                  "Study Material",
                  "Current Affairs",
                  "Prelims PYQ",
                  "Mains Answer Writing",
                  "Geography",
                  "Economy",
                  "Polity",
                  "Environment",
                  "History",
                  "Internal Security",
                ].map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label style={styles.contentUploadDrop}>
              <span style={styles.contentUploadDropIcon}>↑</span>
              <strong>{contentFile ? contentFile.name : "Choose a file to upload"}</strong>
              <small>PDFs and study files up to 50 MB</small>
              <input
                type="file"
                required
                onChange={(event) => setContentFile(event.target.files?.[0] || null)}
                style={styles.contentUploadFileInput}
              />
            </label>

            <div style={styles.contentUploadActions}>
              <button
                type="submit"
                disabled={contentUploading}
                style={{
                  ...styles.contentUploadSubmit,
                  opacity: contentUploading ? 0.65 : 1,
                  cursor: contentUploading ? "wait" : "pointer",
                }}
              >
                {contentUploading ? "Uploading..." : "Upload content"}
              </button>
              <span style={styles.contentUploadHint}>
                Secure direct-to-storage upload · Maximum file size: 50 MB.
              </span>
            </div>

            {contentUploadMessage && (
              <div
                role="status"
                style={{
                  ...styles.contentUploadMessage,
                  ...(contentUploadMessage.startsWith("Upload successful")
                    ? styles.contentUploadSuccess
                    : styles.contentUploadError),
                }}
              >
                {contentUploadMessage}
              </div>
            )}
          </form>
          <div style={styles.contentUploadFootnote}>
            Note: this uploads a file to storage. Publishing it into a course or Current Affairs feed requires the corresponding content database integration.
          </div>
        </section>

        {/* =================================================
            STUDY MATERIAL CONTENT STUDIO
        ================================================= */}
        <section id="sambhav-content-studio" className="sambhav-content-upload" style={{ ...styles.contentUploadSection, marginTop: 24 }}>
          <div style={styles.contentUploadHeader}>
            <div>
              <div style={styles.contentUploadEyebrow}>ADMIN CONTROL CENTER</div>
              <h2 style={styles.contentUploadTitle}>Content Studio</h2>
              <p style={styles.contentUploadDescription}>
                Create persistent storage folders, review published Study Material records, and remove content with confirmation.
              </p>
            </div>
            <div style={styles.contentUploadIcon}>▤</div>
          </div>

          <form onSubmit={createContentFolder} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "end", marginBottom: 18 }}>
            <label style={{ display: "block", minWidth: 0, fontSize: 12, fontWeight: 800 }}>
              Create folder
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                maxLength={60}
                placeholder="e.g. Polity, Internal Security, Hindi Notes"
                style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 7, padding: "12px 13px", borderRadius: 10, border: "1px solid #d9d0bd", background: "#fffdf9", color: "#151515", fontSize: 13 }}
              />
            </label>
            <button type="submit" disabled={libraryActionBusy} style={{ ...styles.headerButton, minHeight: 42, opacity: libraryActionBusy ? .65 : 1 }}>
              {libraryActionBusy ? "Working…" : "+ Create Folder"}
            </button>
          </form>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 220px", fontSize: 12, color: "#77736b" }}>
              <strong style={{ color: "#151515" }}>{libraryFolders.length}</strong> folders · <strong style={{ color: "#151515" }}>{libraryItems.length}</strong> material records
            </div>
            <input
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="Search content by title or subject…"
              aria-label="Search content records"
              style={{ flex: "1 1 220px", maxWidth: 360, padding: "10px 12px", borderRadius: 10, border: "1px solid #d9d0bd", background: "#fffdf9", color: "#151515", fontSize: 12 }}
            />
            <button type="button" onClick={loadContentLibrary} disabled={libraryLoading || libraryActionBusy} style={styles.headerButton}>
              {libraryLoading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          {libraryFolders.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {libraryFolders.map((folder) => (
                <span key={folder} style={{ border: "1px solid #e4dac6", background: "#f8f3e8", borderRadius: 999, padding: "7px 10px", color: "#5c4821", fontSize: 11, fontWeight: 800 }}>▰ {folder}</span>
              ))}
            </div>
          )}

          {libraryMessage && (
            <div role="status" style={{ margin: "10px 0 14px", padding: "11px 13px", borderRadius: 10, background: "#f8f3e8", border: "1px solid #e4dac6", color: "#59471f", fontSize: 12, lineHeight: 1.5 }}>
              {libraryMessage}
            </div>
          )}

          <div style={{ display: "grid", gap: 9 }}>
            {libraryItems
              .filter((item) => `${item.title || ""} ${item.subject || ""} ${item.category || ""} ${item.topic || ""}`.toLowerCase().includes(librarySearch.trim().toLowerCase()))
              .map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 13px", border: "1px solid #e8e0d0", borderRadius: 12, background: "#fffdf9" }}>
                  <div style={{ width: 36, height: 40, borderRadius: 9, display: "grid", placeItems: "center", background: "#171717", color: "#dfc477", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>PDF</div>
                  <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                    <div style={{ fontSize: 13, fontWeight: 850, color: "#191919", overflowWrap: "anywhere" }}>{item.title || "Untitled content"}</div>
                    <div style={{ marginTop: 4, fontSize: 11, color: "#77736b" }}>{[item.subject || item.category, item.topic, item.language, item.exam_type].filter(Boolean).join(" · ") || "Study Material"} · {item.published ? "Published" : "Draft"}</div>
                  </div>
                  <button type="button" disabled={libraryActionBusy} onClick={() => deleteContentItem(item)} style={{ border: "1px solid #e3b8b2", background: "#fff5f3", color: "#a52c24", borderRadius: 9, padding: "9px 11px", fontSize: 11, fontWeight: 850, cursor: libraryActionBusy ? "wait" : "pointer" }}>
                    Delete Content
                  </button>
                </div>
              ))}
            {!libraryLoading && libraryItems.length === 0 && (
              <div style={{ border: "1px dashed #d9d0bd", borderRadius: 12, padding: 20, color: "#77736b", textAlign: "center", fontSize: 12 }}>
                No content records were returned. Refresh after uploading a Study Material file.
              </div>
            )}
          </div>
          <p style={{ margin: "14px 0 0", color: "#77736b", fontSize: 10, lineHeight: 1.6 }}>
            Folder names are stored as placeholder objects under admin-folders/ in the configured Supabase bucket. Deleting a material removes its library record and attempts to clean up its stored file.
          </p>
        </section>

        {/* =================================================
            THE HINDU PDF EXTRACTION
        ================================================= */}
        <section id="admin-the-hindu-extraction" className="sambhav-content-upload" style={{ ...styles.contentUploadSection, marginTop: 24 }}>
          <div style={styles.contentUploadHeader}>
            <div>
              <div style={styles.contentUploadEyebrow}>CURRENT AFFAIRS AUTOMATION</div>
              <h2 style={styles.contentUploadTitle}>The Hindu PDF Extraction</h2>
              <p style={styles.contentUploadDescription}>Upload the full newspaper PDF. The existing SAMBHAV Current Affairs AI route creates bilingual Hindi/English records and checks duplicates.</p>
            </div>
            <div style={styles.contentUploadIcon}>AI</div>
          </div>
          <form onSubmit={handleTheHinduExtraction} style={{ ...styles.contentUploadForm, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <label style={styles.contentUploadLabel}>
              Newspaper date
              <input type="date" value={hinduDate} onChange={(e) => setHinduDate(e.target.value)} required style={styles.contentUploadInput} />
            </label>
            <label style={styles.contentUploadDrop}>
              <span style={styles.contentUploadDropIcon}>↑</span>
              <strong>{hinduPdf ? hinduPdf.name : "Choose The Hindu newspaper PDF"}</strong>
              <small>PDF only · up to 50 MB · text-based PDF recommended</small>
              <input type="file" accept="application/pdf,.pdf" required onChange={(e) => setHinduPdf(e.target.files?.[0] || null)} style={styles.contentUploadFileInput} />
            </label>
            <div style={{ ...styles.contentUploadActions, gridColumn: "1 / -1" }}>
              <button type="submit" disabled={hinduBusy} style={{ ...styles.contentUploadSubmit, opacity: hinduBusy ? 0.65 : 1, cursor: hinduBusy ? "wait" : "pointer" }}>
                {hinduBusy ? "Extracting newspaper…" : "Extract & Publish Current Affairs"}
              </button>
              <span style={styles.contentUploadHint}>Uses the existing /api/current-affairs/ai pipeline. Telegram webhook remains unchanged.</span>
            </div>
            {hinduMessage && <div role="status" style={{ ...styles.contentUploadMessage, ...(hinduMessage.startsWith("Extraction complete") ? styles.contentUploadSuccess : styles.contentUploadError), gridColumn: "1 / -1" }}>{hinduMessage}</div>}
          </form>
          {hinduResults && (
            <div style={{ marginTop: 18, padding: 16, border: "1px solid rgba(120,130,150,.25)", borderRadius: 12 }}>
              <strong>Extraction report · {hinduResults.date}</strong>
              <p style={{ margin: "8px 0", fontSize: 13 }}>Text scanned: {(hinduResults.scannedCharacters || 0).toLocaleString()} characters · Candidates: {hinduResults.candidates || 0} · Published: {hinduResults.published || 0} · Skipped: {hinduResults.skipped || 0} · Failed: {hinduResults.failed || 0}</p>
              {hinduResults.warning && <p style={{ margin: "8px 0", fontSize: 12, color: "#a16207" }}>{hinduResults.warning}</p>}
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {(hinduResults.results || []).map((item, index) => <div key={`${item.title}-${index}`} style={{ padding: 10, borderRadius: 8, background: "rgba(120,130,150,.08)", fontSize: 13 }}><strong>{item.title}</strong><div style={{ marginTop: 4, opacity: .8 }}>{item.status}{item.error ? ` — ${item.error}` : item.reason ? ` — ${item.reason}` : ""}</div></div>)}
              </div>
            </div>
          )}
          <div style={styles.contentUploadFootnote}>Review Current Affairs after extraction. Text-only PDF parsing cannot reliably read scanned pages; extraction is heuristic-based, so inspect the report for missed articles. Re-running is safe for duplicate checking.</div>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section
          style={styles.statsGrid}
          className="sambhav-stats-grid"
        >
          <StatCard
            label="Total Users"
            value={users.length}
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
              placeholder="Search name, email, username, order ID..."
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
                Unable to load admin data
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
              {/* =================================================
                  ACCESS REQUESTS
              ================================================= */}

              <section
                style={styles.panel}
              >
                <div
                  style={
                    styles.panelHeader
                  }
                  className="sambhav-panel-header"
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
                      className="sambhav-panel-title"
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

              {/* =================================================
                  JOINED USERS
              ================================================= */}

              <section
                style={styles.panel}
              >
                <div
                  style={
                    styles.panelHeader
                  }
                  className="sambhav-panel-header"
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
                      className="sambhav-panel-title"
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

              {/* =================================================
                  BLOCKED
              ================================================= */}

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
                    className="sambhav-panel-header"
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

              {/* =================================================
                  PREMIUM OVERVIEW
              ================================================= */}

              <section
                style={
                  styles.premiumOverview
                }
                className="sambhav-premium-overview"
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
                    {
                      paidPremiumUsers.length
                    }{" "}
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
                  className="sambhav-premium-numbers"
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

              {/* =================================================
                  SECURITY
              ================================================= */}

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
          style={styles.footer}
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
        style={styles.statTop}
      >
        <span
          style={styles.statLabel}
        >
          {label}
        </span>

        <span
          style={styles.statIcon}
        >
          {icon}
        </span>
      </div>

      <div
        style={styles.statValue}
      >
        {value}
      </div>

      <div
        style={styles.statDetail}
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
   PENDING USER — COMPACT RESPONSIVE CARD
========================================================= */

function PendingUserCard({
  user,
  actionLoading,
  onApprove,
  onReject,
}) {
  const approving = actionLoading === `${user.id}-approved`;
  const rejecting = actionLoading === `${user.id}-rejected`;

  return (
    <div className="sambhav-compact-user-card" style={styles.userCard}>
      <div className="sambhav-compact-user-content" style={styles.userCardContent}>
        <UserInfo user={user} status="pending" />
        <div style={styles.userCardActions} className="sambhav-user-card-actions sambhav-compact-user-actions">
          <button
            onClick={onReject}
            disabled={rejecting || approving}
            style={styles.cancelButton}
          >
            {rejecting ? "Rejecting..." : "Reject"}
          </button>
          <button
            onClick={onApprove}
            disabled={rejecting || approving}
            style={styles.approveButton}
          >
            {approving ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   JOINED USER — COMPACT RESPONSIVE CARD
========================================================= */

function JoinedUserCard({
  user,
  actionLoading,
  onRemove,
  onBlock,
}) {
  const removing = actionLoading === `${user.id}-rejected`;
  const blocking = actionLoading === `${user.id}-banned`;

  function handleRemove() {
    const confirmed = window.confirm(
      `Remove access from ${
        user.first_name || user.email || "this user"
      }?\n\nThey will be able to access the account again after the account is approved.`
    );
    if (confirmed) onRemove();
  }

  function handleBlock() {
    const confirmed = window.confirm(
      `Block ${
        user.first_name || user.email || "this user"
      }?\n\nThis account will be blocked from access.`
    );
    if (confirmed) onBlock();
  }

  return (
    <div
      className={`sambhav-compact-user-card ${
        user.premium_active ? "sambhav-premium-user-card" : ""
      }`}
      style={{
        ...styles.userCard,
        ...(user.premium_active ? styles.premiumUserCard : {}),
      }}
    >
      <div className="sambhav-compact-user-content" style={styles.userCardContent}>
        <UserInfo user={user} status="approved" joined />
        <div style={styles.userCardActions} className="sambhav-user-card-actions sambhav-compact-user-actions">
          <button
            onClick={handleRemove}
            disabled={removing || blocking}
            style={styles.removeButton}
          >
            {removing ? "Removing..." : "Remove Access"}
          </button>
          <button
            onClick={handleBlock}
            disabled={removing || blocking}
            style={styles.blockButton}
          >
            {blocking ? "Blocking..." : "Block User"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BANNED USER — COMPACT RESPONSIVE CARD
========================================================= */

function BannedUserCard({
  user,
  actionLoading,
  onUnblock,
}) {
  const unblocking = actionLoading === `${user.id}-rejected`;

  function handleUnblock() {
    const confirmed = window.confirm(
      `Unblock ${user.first_name || user.email || "this user"}?`
    );
    if (confirmed) onUnblock();
  }

  return (
    <div className="sambhav-compact-user-card sambhav-blocked-user-card" style={styles.userCard}>
      <div className="sambhav-compact-user-content" style={styles.userCardContent}>
        <UserInfo user={user} status="banned" />
        <div style={styles.userCardActions} className="sambhav-user-card-actions sambhav-compact-user-actions">
          <button
            onClick={handleUnblock}
            disabled={unblocking}
            style={styles.unblockButton}
          >
            {unblocking ? "Unblocking..." : "Unblock User"}
          </button>
        </div>
      </div>
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
  const initials = (
    user.first_name ||
    user.email ||
    "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  const plan = String(
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
      style={styles.userMain}
    >
      {/* USER IDENTITY */}

      <div
        style={styles.userIdentity}
        className="sambhav-user-identity"
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
          style={styles.userInfo}
        >
          <div
            style={
              styles.userNameRow
            }
          >
            <h3
              style={styles.userName}
              className="sambhav-user-name"
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
            style={styles.email}
          >
            {user.email ||
              "No email"}
          </div>

          <div
            style={
              styles.userMetaRow
            }
          >
            {user.username ? (
              <span>
                @{user.username}
              </span>
            ) : (
              <span>
                No username
              </span>
            )}

            {user.telegram_id && (
              <>
                <span>•</span>

                <span>
                  TG {user.telegram_id}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ACCOUNT DETAILS */}

      <div
        style={
          styles.accountDetails
        }
        className="sambhav-account-details"
      >
        <InfoItem
          label="Joined"
          value={formatDate(
            user.created_at
          )}
        />

        <InfoItem
          label="Last Login"
          value={formatDateTime(
            user.last_login_at
          )}
        />

        <InfoItem
          label="Plan"
          value={
            isPremium
              ? formatPlan(plan)
              : "Free"
          }
        />

        <InfoItem
          label="Expires"
          value={
            isPremium
              ? formatDate(
                  user.premium_expires_at
                )
              : "—"
          }
        />
      </div>

      {/* SUBSCRIPTION */}

      {isPremium && (
        <div
          style={
            styles.subscriptionBox
          }
          className="sambhav-subscription-box"
        >
          <div
            style={
              styles.subscriptionItem
            }
          >
            <span
              style={
                styles.subscriptionLabel
              }
            >
              ORDER ID
            </span>

            <strong
              style={
                styles.subscriptionValue
              }
            >
              {user.order_id
                ? shortId(
                    user.order_id
                  )
                : "—"}
            </strong>
          </div>

          <div
            style={
              styles.subscriptionItem
            }
          >
            <span
              style={
                styles.subscriptionLabel
              }
            >
              PAYMENT ID
            </span>

            <strong
              style={
                styles.subscriptionValue
              }
            >
              {user.payment_id
                ? shortId(
                    user.payment_id
                  )
                : "—"}
            </strong>
          </div>

          <div
            style={
              styles.subscriptionItem
            }
          >
            <span
              style={
                styles.subscriptionLabel
              }
            >
              AMOUNT
            </span>

            <strong
              style={
                styles.subscriptionValue
              }
            >
              ₹
              {user.subscription_amount ??
                0}
            </strong>
          </div>
        </div>
      )}

      {!joined &&
        user.created_at && (
          <div
            style={styles.requested}
          >
            Requested{" "}
            {formatDateTime(
              user.created_at
            )}
          </div>
        )}
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
      style={styles.infoItem}
      className="sambhav-info-item"
    >
      <span
        style={styles.infoLabel}
      >
        {label}
      </span>

      <strong
        style={styles.infoValue}
        className="sambhav-info-value"
      >
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
      style={styles.emptyState}
    >
      <div
        style={styles.emptyIcon}
      >
        {icon}
      </div>

      <h3
        style={styles.emptyTitle}
      >
        {title}
      </h3>

      <p
        style={styles.emptyText}
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

  const text = String(plan);

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
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
      "radial-gradient(ellipse at top left,rgba(199,168,93,.12),transparent 34%),linear-gradient(180deg,#101010 0%,#080808 100%)",
    color: "#f5f2eb",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif',
    padding:
      "24px 16px 60px",
  },

  container: {
    width: "100%",
    maxWidth: "1360px",
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
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: "900",
    boxShadow:
      "0 8px 22px rgba(0,0,0,.16)",
  },

  brand: {
    fontSize: "15px",
    fontWeight: "900",
    letterSpacing: ".3px",
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
    borderRadius: "11px",
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
    borderRadius: "11px",
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
    borderRadius: "12px",
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
    padding: "0 5px",
    borderRadius: "999px",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: "17px",
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
    alignItems: "center",
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
    borderRadius: "50%",
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
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  hero: {
    background:
      "linear-gradient(135deg,#0b0b0b,#202020)",
    color: "#fff",
    borderRadius: "28px",
    padding: "38px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "30px",
    marginBottom: "15px",
    boxShadow:
      "0 18px 50px rgba(0,0,0,.12)",
  },

  heroEyebrow: {
    fontSize: "9px",
    letterSpacing: "2px",
    color: "#999",
    fontWeight: "900",
    marginBottom: "12px",
  },

  heroTitle: {
    margin: 0,
    fontSize:
      "clamp(30px,5vw,48px)",
    lineHeight: "1.02",
    letterSpacing: "-2px",
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
    alignItems: "center",
    gap: "7px",
    padding:
      "7px 10px",
    border:
      "1px solid #444",
    borderRadius: "999px",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: "1px",
    color: "#ccc",
  },

  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#fff",
  },

  heroTotal: {
    marginTop: "20px",
    fontSize: "42px",
    fontWeight: "900",
    letterSpacing: "-2px",
  },

  heroTotalLabel: {
    color: "#777",
    fontSize: "8px",
    letterSpacing: "1.4px",
    fontWeight: "900",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(155px,1fr))",
    gap: "10px",
    marginBottom: "15px",
  },

  statCard: {
    background: "#fff",
    border:
      "1px solid #e2e2df",
    borderRadius: "17px",
    padding: "17px",
  },

  statActive: {
    borderColor: "#111",
  },

  statPremium: {
    background:
      "linear-gradient(145deg,#fff,#f5f0e4)",
    borderColor: "#d8c79e",
  },

  statTop: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  statLabel: {
    color: "#777",
    fontSize: "9px",
    fontWeight: "800",
  },

  statIcon: {
    fontSize: "16px",
    fontWeight: "900",
  },

  statValue: {
    marginTop: "12px",
    fontSize: "29px",
    fontWeight: "900",
    letterSpacing: "-1px",
  },

  statDetail: {
    marginTop: "3px",
    color: "#999",
    fontSize: "9px",
  },

  searchPanel: {
    background: "#fff",
    border:
      "1px solid #e2e2df",
    borderRadius: "20px",
    padding: "16px",
    marginBottom: "15px",
  },

  searchHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: "12px",
  },

  searchEyebrow: {
    fontSize: "8px",
    letterSpacing: "1.4px",
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
    background: "#f6f6f4",
    border:
      "1px solid #e6e6e3",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
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
    background: "transparent",
    fontSize: "12px",
    color: "#111",
  },

  clearSearch: {
    border: "none",
    background: "transparent",
    color: "#888",
    fontSize: "18px",
    cursor: "pointer",
  },

  filterRow: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    marginTop: "11px",
  },

  filterButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    color: "#555",
    borderRadius: "999px",
    padding: "7px 9px",
    fontSize: "9px",
    fontWeight: "800",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  filterButtonActive: {
    background: "#111",
    color: "#fff",
    borderColor: "#111",
  },

  filterCount: {
    background: "#f0f0ed",
    color: "#777",
    borderRadius: "999px",
    padding: "2px 5px",
    fontSize: "8px",
  },

  filterCountActive: {
    background: "#333",
    color: "#fff",
  },

  errorBox: {
    marginBottom: "15px",
    padding: "16px",
    borderRadius: "16px",
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
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    flexShrink: 0,
  },

  errorText: {
    marginTop: "2px",
    color: "#888",
  },

  retryButton: {
    marginTop: "8px",
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  loadingBox: {
    background: "#fff",
    border:
      "1px solid #e2e2df",
    borderRadius: "20px",
    padding: "65px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#777",
    fontSize: "11px",
    gap: "5px",
  },

  loadingOrb: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border:
      "3px solid #ddd",
    borderTopColor: "#111",
    marginBottom: "8px",
  },

  panel: {
    background: "#fff",
    border:
      "1px solid #e2e2df",
    borderRadius: "23px",
    overflow: "hidden",
    marginBottom: "15px",
  },

  panelHeader: {
    padding: "23px 24px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "20px",
    borderBottom:
      "1px solid #eee",
  },

  panelEyebrow: {
    fontSize: "8px",
    letterSpacing: "1.5px",
    fontWeight: "900",
    color: "#999",
    marginBottom: "6px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "22px",
    letterSpacing: "-.5px",
  },

  panelDescription: {
    color: "#888",
    fontSize: "11px",
    margin: "6px 0 0",
  },

  panelCounter: {
    background: "#f1f1ee",
    borderRadius: "999px",
    padding: "8px 10px",
    fontSize: "15px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  panelCounterDark: {
    background: "#111",
    color: "#fff",
    borderRadius: "999px",
    padding: "8px 10px",
    fontSize: "15px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  userList: {
    display: "flex",
    flexDirection: "column",
  },

  /* =======================================================
     NEW PREMIUM USER CARD STRUCTURE
  ======================================================= */

  userCard: {
    padding: "14px 16px",
    borderBottom: "1px solid #e9e4d8",
    background: "#fffdf9",
    transition: "background .18s ease, box-shadow .18s ease",
  },

  premiumUserCard: {
    background:
      "linear-gradient(135deg,#fffdf8 0%,#fff 72%)",
    borderLeft:
      "3px solid #b59a57",
  },

  userCardContent: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  userMain: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: 0,
  },

  userIdentity: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    minWidth: 0,
  },

  avatar: {
    width: "40px",
    height: "40px",
    flexShrink: 0,
    borderRadius: "12px",
    background:
      "linear-gradient(145deg,#111,#333)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: "900",
  },

  premiumAvatar: {
    background:
      "linear-gradient(145deg,#171717,#705d30)",
  },

  userInfo: {
    minWidth: 0,
    flex: 1,
  },

  userNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },

  userName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "900",
    letterSpacing: "-.2px",
  },

  email: {
    color: "#444",
    fontSize: "11px",
    marginTop: "4px",
    wordBreak: "break-word",
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
    width: "100%",
    display: "grid",
    gridTemplateColumns:
      "repeat(4,minmax(0,1fr))",
    gap: "10px",
  },

  infoItem: {
    minWidth: 0,
    background: "#f7f7f4",
    border:
      "1px solid #ecebe7",
    borderRadius: "12px",
    padding: "11px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  infoLabel: {
    fontSize: "8px",
    color: "#999",
    fontWeight: "800",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  infoValue: {
    fontSize: "12px",
    color: "#171717",
    fontWeight: "900",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  subscriptionBox: {
    width: "100%",
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: "8px",
    padding: "11px",
    background:
      "linear-gradient(135deg,#f8f4e8,#fbfaf6)",
    border:
      "1px solid #e5dcc4",
    borderRadius: "13px",
  },

  subscriptionItem: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  subscriptionLabel: {
    fontSize: "7px",
    color: "#9b8b61",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  subscriptionValue: {
    fontSize: "9px",
    color: "#514525",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  requested: {
    color: "#aaa",
    fontSize: "9px",
    marginTop: "1px",
  },

  badge: {
    borderRadius: "999px",
    padding: "4px 7px",
    fontSize: "8px",
    fontWeight: "900",
  },

  pendingBadge: {
    background: "#f0f0ed",
    color: "#555",
  },

  approvedBadge: {
    background: "#e7e7e3",
    color: "#111",
  },

  rejectedBadge: {
    background: "#f1f1ef",
    color: "#777",
  },

  bannedBadge: {
    background: "#111",
    color: "#fff",
  },

  premiumBadge: {
    background: "#eadfbe",
    color: "#695522",
    border:
      "1px solid #d9c793",
    borderRadius: "999px",
    padding: "4px 7px",
    fontSize: "8px",
    fontWeight: "900",
  },

  demoBadge: {
    background: "#eeeae0",
    color: "#77705d",
    border:
      "1px solid #ddd7c7",
    borderRadius: "999px",
    padding: "4px 7px",
    fontSize: "8px",
    fontWeight: "900",
  },

  userCardActions: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
    paddingTop: "1px",
  },

  approveButton: {
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius: "9px",
    padding: "10px 15px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  cancelButton: {
    border:
      "1px solid #ddd",
    background: "#fff",
    color: "#444",
    borderRadius: "9px",
    padding: "10px 15px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  removeButton: {
    border:
      "1px solid #d8d8d5",
    background: "#fff",
    color: "#333",
    borderRadius: "9px",
    padding: "10px 15px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  blockButton: {
    border: "none",
    background: "#111",
    color: "#fff",
    borderRadius: "9px",
    padding: "10px 15px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  unblockButton: {
    border:
      "1px solid #111",
    background: "#fff",
    color: "#111",
    borderRadius: "9px",
    padding: "10px 15px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  emptyState: {
    padding: "55px 25px",
    textAlign: "center",
    color: "#777",
  },

  emptyIcon: {
    width: "43px",
    height: "43px",
    margin:
      "0 auto 11px",
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },

  emptyTitle: {
    margin: "0 0 5px",
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
    borderRadius: "23px",
    padding: "25px",
    marginBottom: "15px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
  },

  premiumEyebrow: {
    fontSize: "8px",
    letterSpacing: "1.6px",
    color: "#b9a976",
    fontWeight: "900",
  },

  premiumTitle: {
    margin: "6px 0 0",
    fontSize: "23px",
    letterSpacing: "-.5px",
  },

  premiumDescription: {
    margin: "7px 0 0",
    color: "#aaa",
    fontSize: "10px",
  },

  premiumNumbers: {
    display: "flex",
    gap: "22px",
  },

  premiumNumbersStrong: {
    fontSize: "24px",
    fontWeight: "900",
  },

  securityCard: {
    display: "flex",
    gap: "13px",
    alignItems: "center",
    background: "#111",
    color: "#fff",
    borderRadius: "18px",
    padding: "17px 19px",
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
  },

  securityText: {
    margin: "4px 0 0",
    color: "#aaa",
    fontSize: "9px",
    lineHeight: "1.5",
  },

  securityStatus: {
    marginLeft: "auto",
    border:
      "1px solid #444",
    color: "#aaa",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "7px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  contentUploadHeaderButton: {
    border: "1px solid #d8c28f",
    background: "linear-gradient(135deg,#e8d6a7,#c4a45d)",
    color: "#171717",
    borderRadius: "10px",
    padding: "10px 13px",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  contentUploadSection: {
    background: "#fff",
    border: "1px solid #e6e9ef",
    borderRadius: "20px",
    padding: "24px",
    margin: "0 0 22px",
    boxShadow: "0 8px 28px rgba(20,30,50,.045)",
    scrollMarginTop: "20px",
  },
  contentUploadHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    paddingBottom: "18px",
    borderBottom: "1px solid #edf0f4",
    marginBottom: "18px",
  },
  contentUploadEyebrow: {
    color: "#9b7b3e",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1.7px",
  },
  contentUploadTitle: {
    margin: "7px 0 0",
    color: "#191d28",
    fontSize: "21px",
    letterSpacing: "-.5px",
  },
  contentUploadDescription: {
    margin: "7px 0 0",
    color: "#737b8a",
    fontSize: "11px",
    lineHeight: "1.6",
  },
  contentUploadIcon: {
    width: "46px",
    height: "46px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background: "#f5f0e4",
    color: "#96743a",
    fontSize: "25px",
    fontWeight: "800",
  },
  contentUploadForm: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: "15px",
  },
  contentUploadLabel: {
    display: "grid",
    gap: "8px",
    color: "#444b59",
    fontSize: "10px",
    fontWeight: "800",
    minWidth: 0,
  },
  contentUploadInput: {
    width: "100%",
    minWidth: 0,
    border: "1px solid #dfe4ec",
    background: "#fff",
    borderRadius: "10px",
    padding: "12px 13px",
    color: "#202633",
    fontSize: "11px",
    outline: "none",
  },
  contentUploadDrop: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "150px",
    border: "1px dashed #c9d0dc",
    borderRadius: "14px",
    background: "#fafbfc",
    padding: "20px",
    color: "#333a48",
    fontSize: "11px",
    cursor: "pointer",
    textAlign: "center",
  },
  contentUploadDropIcon: {
    display: "grid",
    placeItems: "center",
    width: "35px",
    height: "35px",
    borderRadius: "11px",
    background: "#eee7d6",
    color: "#98763b",
    fontSize: "23px",
    fontWeight: "800",
  },
  contentUploadFileInput: {
    maxWidth: "100%",
    marginTop: "4px",
    fontSize: "10px",
    color: "#777f8d",
  },
  contentUploadActions: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  contentUploadSubmit: {
    border: "1px solid #191d27",
    background: "#191d27",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "11px",
    fontWeight: "800",
  },
  contentUploadHint: {
    color: "#858c99",
    fontSize: "9px",
    lineHeight: "1.5",
  },
  contentUploadMessage: {
    gridColumn: "1 / -1",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "10px",
    lineHeight: "1.5",
    overflowWrap: "anywhere",
  },
  contentUploadSuccess: {
    background: "#eaf8ef",
    border: "1px solid #ccebd7",
    color: "#23774b",
  },
  contentUploadError: {
    background: "#fff0ee",
    border: "1px solid #f1d5d1",
    color: "#a13f39",
  },
  contentUploadFootnote: {
    marginTop: "14px",
    paddingTop: "13px",
    borderTop: "1px solid #eff1f5",
    color: "#8b919d",
    fontSize: "9px",
    lineHeight: "1.6",
  },

  footer: {
    padding: "20px 3px",
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


