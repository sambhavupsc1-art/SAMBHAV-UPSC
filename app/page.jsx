"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let attempts = 0;

    const authenticate = () => {
      attempts++;

      const webApp = window.Telegram?.WebApp;

      if (!webApp?.initData) {
        if (attempts < 30) {
          setTimeout(authenticate, 200);
          return;
        }

        setError("Telegram authentication data nahi mila.");
        setLoading(false);
        return;
      }

      webApp.ready();
      webApp.expand();

      fetch("/api/auth/me", {
        headers: {
          Authorization: `tma ${webApp.initData}`,
        },
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Authentication failed");
          }

          setUser(data.user);
        })
        .catch((err) => {
          setError(err.message || "Server connection failed.");
        })
        .finally(() => {
          setLoading(false);
        });
    };

    authenticate();
  }, []);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center">
          <h1 className="text-3xl font-bold">SAMBHAV UPSC</h1>

          {loading && (
            <p className="mt-4 text-slate-400">
              Authenticating...
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-red-950 border border-red-800 p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {user && (
            <div className="mt-5">
              <p className="text-xl font-semibold">
                Hello, {user.first_name || "Aspirant"}
              </p>

              <p className="mt-2 text-slate-400">
                Status: {user.status}
              </p>

              {user.status === "pending" && (
                <div className="mt-5 rounded-xl bg-yellow-950 border border-yellow-800 p-4">
                  Admin approval pending.
                </div>
              )}

              {user.status === "approved" && (
                <div className="mt-5 rounded-xl bg-green-950 border border-green-800 p-4">
                  Access approved.
                </div>
              )}

              {user.status === "rejected" && (
                <div className="mt-5 rounded-xl bg-red-950 border border-red-800 p-4">
                  Access rejected.
                </div>
              )}

              {user.status === "banned" && (
                <div className="mt-5 rounded-xl bg-red-950 border border-red-800 p-4">
                  Account blocked.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
