"use client";

import { useCallback, useEffect, useState } from "react";

const METRICS = [
  {
    key: "users",
    label: "Total Users",
    note: "Registered accounts",
    color: "blue",
  },
  {
    key: "pending_users",
    label: "Pending",
    note: "Awaiting approval",
    color: "amber",
  },
  {
    key: "approved_users",
    label: "Approved",
    note: "Approved accounts",
    color: "green",
  },
  {
    key: "banned_users",
    label: "Blocked",
    note: "Restricted accounts",
    color: "red",
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    note: "Total subscription records",
    color: "purple",
  },
];

const CONTENT_METRICS = [
  {
    key: "current_affairs_items",
    label: "Current Affairs",
    note: "Database items",
  },
  {
    key: "mains_evaluations",
    label: "Mains Evaluations",
    note: "Saved evaluation records",
  },
  {
    key: "prelims_questions",
    label: "Prelims Questions",
    note: "Question records",
  },
];

function MetricCard({ item, metric }) {
  const available = metric?.available === true;

  return (
    <article className="sco-metric">
      <div className="sco-metric-label">
        <span className={`sco-dot ${item.color}`} />
        <span>{item.label}</span>
      </div>

      <strong className="sco-metric-number">
        {!metric
          ? "—"
          : available
            ? Number(metric.value).toLocaleString("en-IN")
            : "N/A"}
      </strong>

      <p>{item.note}</p>
    </article>
  );
}

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadOverview = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/admin/overview", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.error || `Request failed (${response.status})`
        );
      }

      setData(result);
      setUpdatedAt(new Date());
    } catch (err) {
      console.error("Admin overview:", err);
      setError(err.message || "Overview load nahi ho paya.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();

    const timer = setInterval(() => {
      loadOverview(true);
    }, 30000);

    return () => clearInterval(timer);
  }, [loadOverview]);

  const metrics = data?.metrics || {};

  return (
    <section className="sco-root">
      <style jsx>{`
        .sco-root {
          width: 100%;
          margin: 22px 0 28px;
          color: #171717;
        }

        .sco-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }

        .sco-eyebrow {
          margin-bottom: 8px;
          color: #8c867b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .sco-title {
          margin: 0;
          font-size: clamp(24px, 3vw, 32px);
          line-height: 1.15;
          letter-spacing: -1px;
          font-weight: 760;
        }

        .sco-subtitle {
          margin: 7px 0 0;
          color: #77746e;
          font-size: 13px;
          line-height: 1.5;
        }

        .sco-refresh {
          padding: 10px 15px;
          border: 1px solid #e4e1d9;
          border-radius: 12px;
          background: #fff;
          color: #171717;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
        }

        .sco-refresh:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        .sco-status {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          padding: 11px 13px;
          margin-bottom: 14px;
          border: 1px solid #e6e9e0;
          border-radius: 12px;
          background: #fafbf7;
          color: #466747;
          font-size: 12px;
        }

        .sco-live-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #26955b;
        }

        .sco-updated {
          margin-left: auto;
          color: #8b8983;
          font-size: 11px;
        }

        .sco-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 11px;
        }

        .sco-metric {
          min-width: 0;
          padding: 15px;
          border: 1px solid #e9e7e0;
          border-radius: 15px;
          background: #fff;
          transition: border-color 160ms ease;
        }

        .sco-metric:hover {
          border-color: #d4c6a4;
        }

        .sco-metric-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #66635d;
          font-size: 12px;
          font-weight: 650;
        }

        .sco-dot {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border-radius: 3px;
        }

        .sco-dot.blue { background: #4786db; }
        .sco-dot.amber { background: #d49a35; }
        .sco-dot.green { background: #299966; }
        .sco-dot.red { background: #d65c55; }
        .sco-dot.purple { background: #8863c9; }

        .sco-metric-number {
          display: block;
          margin: 15px 0 6px;
          font-size: 30px;
          line-height: 1;
          font-weight: 760;
          letter-spacing: -1px;
          font-variant-numeric: tabular-nums;
        }

        .sco-metric p {
          margin: 0;
          color: #8a8881;
          font-size: 11px;
          line-height: 1.5;
        }

        .sco-content-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 11px;
          margin-top: 11px;
        }

        .sco-content-card {
          padding: 15px 16px;
          border: 1px solid #e9e7e0;
          border-radius: 15px;
          background: #fff;
        }

        .sco-content-label {
          color: #65625c;
          font-size: 12px;
          font-weight: 650;
        }

        .sco-content-number {
          display: block;
          margin: 9px 0 5px;
          font-size: 26px;
          font-weight: 760;
          letter-spacing: -0.7px;
        }

        .sco-content-note {
          color: #898780;
          font-size: 11px;
        }

        .sco-error {
          padding: 13px;
          margin-bottom: 12px;
          border: 1px solid #f0d3cd;
          border-radius: 12px;
          background: #fff7f5;
          color: #9e392f;
          font-size: 12px;
          line-height: 1.5;
        }

        .sco-error button {
          margin-left: 8px;
          padding: 5px 9px;
          border: 1px solid #e7c6c0;
          border-radius: 7px;
          background: #fff;
          cursor: pointer;
        }

        .sco-warning {
          margin: 12px 0 0;
          color: #8a6a2b;
          font-size: 11px;
          line-height: 1.6;
        }

        @media (max-width: 1050px) {
          .sco-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .sco-heading {
            align-items: flex-start;
          }

          .sco-title {
            font-size: 25px;
          }

          .sco-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .sco-metric {
            padding: 13px;
            border-radius: 13px;
          }

          .sco-metric-number {
            font-size: 27px;
          }

          .sco-content-grid {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .sco-updated {
            width: 100%;
            margin-left: 16px;
          }
        }
      `}</style>

      <div className="sco-heading">
        <div>
          <div className="sco-eyebrow">SAMBHAV / ADMIN</div>
          <h2 className="sco-title">Platform Overview</h2>
          <p className="sco-subtitle">
            Live data from your SAMBHAV UPSC database
          </p>
        </div>

        <button
          type="button"
          className="sco-refresh"
          onClick={() => loadOverview()}
          disabled={loading || refreshing}
        >
          {refreshing || loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="sco-error" role="alert">
          {error}
          <button type="button" onClick={() => loadOverview()}>
            Retry
          </button>
        </div>
      )}

      <div className="sco-status">
        <span className="sco-live-dot" />
        <span>
          {data ? "Live database counts" : "Connecting to database"}
        </span>
        {updatedAt && (
          <span className="sco-updated">
            Updated {updatedAt.toLocaleTimeString("en-IN")}
          </span>
        )}
      </div>

      <div className="sco-grid">
        {METRICS.map((item) => (
          <MetricCard
            key={item.key}
            item={item}
            metric={metrics[item.key]}
          />
        ))}
      </div>

      <div className="sco-content-grid">
        {CONTENT_METRICS.map((item) => {
          const metric = metrics[item.key];

          return (
            <article className="sco-content-card" key={item.key}>
              <div className="sco-content-label">{item.label}</div>
              <strong className="sco-content-number">
                {!metric
                  ? "—"
                  : metric.available
                    ? Number(metric.value).toLocaleString("en-IN")
                    : "N/A"}
              </strong>
              <div className="sco-content-note">{item.note}</div>
            </article>
          );
        })}
      </div>

      {data?.unavailable_metrics?.length > 0 && (
        <p className="sco-warning">
          Some metrics could not be retrieved. Check the API response before
          using those figures.
        </p>
      )}

      <p className="sco-warning">
        Subscription records are not the same as active subscribers or
        verified revenue. These figures represent database row counts.
      </p>
    </section>
  );
}
