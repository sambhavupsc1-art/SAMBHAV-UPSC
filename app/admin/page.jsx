"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadUsers() {
    try {
      const webApp = window.Telegram?.WebApp;

      if (!webApp?.initData) {
        setMessage("Telegram authentication data nahi mila.");
        setLoading(false);
        return;
      }

      webApp.ready();
      webApp.expand();

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `tma ${webApp.initData}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Access denied");
        setLoading(false);
        return;
      }

      setUsers(data.users || []);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Server connection failed.");
    }

    setLoading(false);
  }

  async function updateUser(telegramId, status) {
    try {
      const webApp = window.Telegram?.WebApp;

      if (!webApp?.initData) {
        setMessage("Telegram authentication data nahi mila.");
        return;
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
        setMessage(data.error || "Action failed");
        return;
      }

      setMessage(
        status === "approved"
          ? "User approved successfully."
          : "User rejected successfully."
      );

      await loadUsers();
    } catch (error) {
      console.error(error);
      setMessage("Server connection failed.");
    }
  }

  useEffect(() => {
    let attempts = 0;

    const waitForTelegram = () => {
      attempts++;

      if (window.Telegram?.WebApp?.initData) {
        loadUsers();
        return;
      }

      if (attempts < 30) {
        setTimeout(waitForTelegram, 200);
        return;
      }

      setMessage("Telegram authentication data nahi mila.");
      setLoading(false);
    };

    waitForTelegram();
  }, []);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main className="min-h-screen bg-slate-950 text-white p-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold">
            SAMBHAV UPSC
          </h1>

          <p className="text-slate-400 mt-1">
            Admin Panel
          </p>

          {message && (
            <div className="mt-5 rounded-xl bg-slate-800 p-4 text-sm">
              {message}
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-xl font-semibold">
                Access Requests
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-slate-400">
                Loading...
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 text-slate-400">
                No pending requests.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {users.map((user) => (
                  <div
                    key={user.telegram_id}
                    className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {user.first_name || "User"}
                      </p>

                      <p className="text-sm text-slate-400">
                        @{user.username || "no_username"}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Telegram ID: {user.telegram_id}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateUser(
                            user.telegram_id,
                            "approved"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-green-600 text-white"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          updateUser(
                            user.telegram_id,
                            "rejected"
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-red-600 text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
