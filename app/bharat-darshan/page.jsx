"use client";

import { useEffect, useMemo, useState } from "react";
import { STATE_META, FEATURE_INDEX } from "./data";

/*
  SAMBHAV UPSC — BHARAT DARSHAN

  Route:
  /bharat-darshan

  Important:
  - Existing SAMBHAV auth/dashboard is not modified.
  - State selection is based on GeoJSON state names -> stable IDs.
  - No coordinate-based state guessing.
  - Static geography is separate from Current Affairs.
*/

const GEOJSON_URL =
  "https://raw.githubusercontent.com/adarshbiradar/maps-geojson/master/india.json";

const MODES = [
  ["explore", "Explore India", "States & UTs"],
  ["rivers", "Rivers", "River systems"],
  ["mountains", "Mountains & Passes", "Relief & passes"],
  ["ecology", "Ecology", "Parks & biodiversity"],
  ["minerals", "Minerals & Resources", "Resource geography"],
  ["agriculture", "Agriculture", "Crops & regions"],
  ["coastal", "Coastal India", "Ports & islands"],
  ["climate", "Climate & Monsoon", "Monsoon geography"],
];

const REGIONS = [
  "All India",
  "North",
  "South",
  "East",
  "West",
  "Central",
  "Northeast",
  "UTs",
];

const NAME_TO_ID = Object.fromEntries(
  Object.entries(STATE_META).map(([id, value]) => [
    normalizeName(value.name),
    id,
  ])
);

const FALLBACK_META = (name) => ({
  name,
  region: "All India",
  capital: "—",
  rivers: ["Data pending verification"],
  relief: ["Data pending verification"],
  crops: ["Data pending verification"],
  ecology: ["Data pending verification"],
  minerals: ["Data pending verification"],
  places: ["Data pending verification"],
  climate: "Verified state profile is being expanded.",
});

const QUIZ = [
  {
    q: "Which river is associated with the Kashmir Valley?",
    options: ["Jhelum", "Mahanadi", "Narmada", "Sabarmati"],
    answer: 0,
    explanation:
      "The Jhelum is the principal river associated with the Kashmir Valley.",
  },
  {
    q: "Which state is strongly associated with the Thar Desert?",
    options: ["Rajasthan", "Kerala", "Assam", "Odisha"],
    answer: 0,
    explanation:
      "The Thar Desert occupies a large part of western Rajasthan.",
  },
  {
    q: "Keibul Lamjao National Park is in which state?",
    options: ["Manipur", "Sikkim", "Meghalaya", "Mizoram"],
    answer: 0,
    explanation:
      "Keibul Lamjao National Park is located in Manipur on Loktak Lake.",
  },
  {
    q: "The Narmada flows broadly between which two major upland systems?",
    options: [
      "Vindhya and Satpura",
      "Aravalli and Himalaya",
      "Nilgiri and Cardamom",
      "Eastern Ghats and Shivalik",
    ],
    answer: 0,
    explanation:
      "The Narmada valley lies between the Vindhya range to the north and Satpura range to the south.",
  },
  {
    q: "Which state is especially important for the northeast/retreating monsoon?",
    options: [
      "Tamil Nadu",
      "Punjab",
      "Rajasthan",
      "Himachal Pradesh",
    ],
    answer: 0,
    explanation:
      "Tamil Nadu receives an important share of its rainfall from the northeast monsoon.",
  },
  {
    q: "Which protected area is associated with the one-horned rhinoceros?",
    options: ["Kaziranga", "Ranthambore", "Dudhwa", "Periyar"],
    answer: 0,
    explanation:
      "Kaziranga National Park in Assam is globally important for the greater one-horned rhinoceros.",
  },
  {
    q: "Which mineral-resource combination is especially important in Chhattisgarh?",
    options: [
      "Iron ore and coal",
      "Petroleum and natural gas",
      "Uranium and gold",
      "Tin and crude oil",
    ],
    answer: 0,
    explanation:
      "Chhattisgarh is an important mineral-producing state, particularly for iron ore and coal.",
  },
  {
    q: "Which river is closely associated with the Punjab-Haryana plain?",
    options: ["Sutlej", "Periyar", "Godavari", "Vaigai"],
    answer: 0,
    explanation:
      "The Sutlej is one of the major rivers of the northwestern river system.",
  },
];

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

/*
  IMPORTANT:
  GeoJSON files can use different property names.
  We check multiple names, but only exact name -> stable ID mapping
  is accepted. No fuzzy coordinate guessing.
*/
function canonicalId(properties = {}) {
  const candidates = [
    properties.ST_NM,
    properties.st_nm,
    properties.NAME_1,
    properties.name,
    properties.NAME,
    properties.state,
    properties.State,
    properties.STATE,
    properties["Name of State"],
    properties["Name of State / UT"],
  ].filter(Boolean);

  for (const candidate of candidates) {
    const id = NAME_TO_ID[normalizeName(candidate)];

    if (id) {
      return id;
    }
  }

  return null;
}

function getFeatureName(properties = {}) {
  return (
    properties.ST_NM ||
    properties.st_nm ||
    properties.NAME_1 ||
    properties.name ||
    properties.NAME ||
    properties.state ||
    properties.State ||
    properties.STATE ||
    "Unknown"
  );
}

function projectPoint([lon, lat], width, height) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;

  return [x, y];
}

function geometryPath(geometry, width, height) {
  if (!geometry) return "";

  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates || [];

  return polygons
    .map((polygon) =>
      polygon
        .map((ring) => {
          return (
            ring
              .map((point, index) => {
                const [x, y] = projectPoint(point, width, height);

                return `${
                  index === 0 ? "M" : "L"
                }${x.toFixed(2)} ${y.toFixed(2)}`;
              })
              .join(" ") + " Z"
          );
        })
        .join(" ")
    )
    .join(" ");
}

function storageKey(user) {
  const id = user?.id || user?.email || user?.user_id || "guest";

  return `sambhav_bharat_darshan_${id}`;
}

export default function BharatDarshanPage() {
  const [theme, setTheme] = useState("light");

  const [geo, setGeo] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [loadingMap, setLoadingMap] = useState(true);

  const [mode, setMode] = useState("explore");
  const [region, setRegion] = useState("All India");
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("overview");

  const [recallIndex, setRecallIndex] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});

  const [compareId, setCompareId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const [mobilePanel, setMobilePanel] = useState(false);

  /*
    Theme + existing SAMBHAV auth
  */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sambhav-theme");

      if (saved === "dark" || saved === "light") {
        setTheme(saved);
      }
    } catch {}

    let cancelled = false;

    fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) return null;

        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data?.user || null);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  /*
    User-specific Bharat Darshan progress.
    Existing authentication remains untouched.
  */
  useEffect(() => {
    try {
      localStorage.setItem("sambhav-theme", theme);

      const raw = localStorage.getItem(storageKey(user));

      if (raw) {
        setProgress(JSON.parse(raw));
      }
    } catch {}
  }, [user, theme]);

  /*
    INDIA MAP DATA

    This is the important fix.
  */
  useEffect(() => {
    let cancelled = false;

    setLoadingMap(true);
    setGeoError("");

    fetch(GEOJSON_URL, {
      method: "GET",
      cache: "force-cache",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `India boundary dataset could not be loaded (${response.status}).`
          );
        }

        return response.json();
      })
      .then((data) => {
        if (cancelled) return;

        if (!data || !Array.isArray(data.features)) {
          throw new Error("Invalid India GeoJSON format.");
        }

        setGeo(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setGeoError(
            error?.message || "India map data could not be loaded."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMap(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const ui =
    theme === "dark"
      ? {
          bg: "#090909",
          surface: "#121212",
          surface2: "#181818",
          text: "#f7f4ec",
          muted: "#a7a39a",
          line: "rgba(255,255,255,.10)",
          gold: "#d6bd79",
          map: "#151515",
        }
      : {
          bg: "#f7f5ef",
          surface: "#ffffff",
          surface2: "#f1eee6",
          text: "#111111",
          muted: "#77736b",
          line: "#e4e0d7",
          gold: "#9b792f",
          map: "#eeeae0",
        };

  /*
    Convert GeoJSON features into:
    feature geometry
    +
    stable state ID
  */
  const features = useMemo(() => {
    return (geo?.features || []).map((feature) => ({
      feature,
      id: canonicalId(feature?.properties),
      name: getFeatureName(feature?.properties),
    }));
  }, [geo]);

  const selected = selectedId
    ? STATE_META[selectedId] || FALLBACK_META(selectedId)
    : null;

  const selectedName = selected?.name || "Select a state or UT";

  /*
    Search:
    - State / UT
    - Rivers
    - Mountains / relief
    - Ecology
    - Minerals
    - Crops
    - Places
  */
  const filteredFeatures = useMemo(() => {
    const q = normalizeName(search);

    return features.filter(({ id }) => {
      if (!id) return false;

      const meta = STATE_META[id];

      if (!meta) return false;

      const regionOk =
        region === "All India" || meta.region === region;

      const searchable = [
        meta.name,
        ...meta.rivers,
        ...meta.relief,
        ...meta.ecology,
        ...meta.minerals,
        ...meta.crops,
        ...meta.places,
        meta.climate,
      ];

      const searchOk =
        !q ||
        searchable.some((value) =>
          normalizeName(value).includes(q)
        );

      return regionOk && searchOk;
    });
  }, [features, region, search]);

  /*
    Mode-specific data
  */
  const modeItems = useMemo(() => {
    if (!selected) return null;

    const map = {
      rivers: ["Rivers", selected.rivers],

      mountains: [
        "Relief & Passes",
        selected.relief,
      ],

      ecology: [
        "Ecology",
        selected.ecology,
      ],

      minerals: [
        "Minerals & Resources",
        selected.minerals,
      ],

      agriculture: [
        "Agriculture",
        selected.crops,
      ],

      coastal: [
        "Coastal / Important Places",
        selected.places,
      ],

      climate: [
        "Climate & Monsoon",
        [selected.climate],
      ],

      explore: [
        "Important Geography",
        [
          ...selected.rivers,
          ...selected.relief,
          ...selected.ecology,
        ],
      ],
    };

    return map[mode] || map.explore;
  }, [selected, mode]);

  /*
    Active recall
  */
  const recallCards = useMemo(() => {
    return Object.values(STATE_META)
      .slice(0, 20)
      .map((state) => ({
        title: state.name,

        prompt:
          `Recall two important UPSC map facts for ${state.name}.`,

        answer:
          `${state.rivers.slice(0, 2).join(" and ")}; ` +
          `${state.relief.slice(0, 2).join(" and ")}.`,
      }));
  }, []);

  const currentRecall =
    recallCards[recallIndex % recallCards.length];

  const currentQuiz = QUIZ[quizIndex];

  /*
    Select state
  */
  function selectState(id) {
    if (!id || !STATE_META[id]) return;

    setSelectedId(id);
    setTab("overview");
    setMobilePanel(true);
    setRecallRevealed(false);

    setProgress((previous) => {
      const next = {
        ...previous,

        [id]: {
          ...(previous[id] || {}),
          status: "Learning",
          lastViewed: new Date().toISOString(),
        },
      };

      try {
        localStorage.setItem(
          storageKey(user),
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });
  }

  /*
    Mark state as mastered
  */
  function markMastered() {
    if (!selectedId) return;

    setProgress((previous) => {
      const next = {
        ...previous,

        [selectedId]: {
          ...(previous[selectedId] || {}),
          status: "Mastered",
          lastViewed: new Date().toISOString(),
        },
      };

      try {
        localStorage.setItem(
          storageKey(user),
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });
  }

  /*
    Quiz
  */
  function answerQuiz(index) {
    if (quizAnswered) return;

    setQuizAnswer(index);
    setQuizAnswered(true);

    if (index === currentQuiz.answer) {
      setQuizScore((score) => score + 1);
    }
  }

  function nextQuiz() {
    setQuizIndex(
      (index) => (index + 1) % QUIZ.length
    );

    setQuizAnswer(null);
    setQuizAnswered(false);
  }

  const masteredCount = Object.values(progress).filter(
    (item) => item?.status === "Mastered"
  ).length;

  const learningCount = Object.values(progress).filter(
    (item) =>
      item?.status === "Learning" ||
      item?.status === "Needs Revision"
  ).length;

  const totalStates = Object.keys(STATE_META).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: ui.bg,
        color: ui.text,
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        paddingBottom: 42,
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .bd-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .bd-scroll::-webkit-scrollbar-thumb {
          background: rgba(130,130,130,.3);
          border-radius: 99px;
        }

        .bd-card {
          transition:
            transform .18s ease,
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .bd-card:hover {
          transform: translateY(-2px);
        }

        .bd-map path {
          transition:
            fill .14s ease,
            stroke .14s ease;
        }

        .bd-map path:hover {
          fill: #d6bd79 !important;
          stroke: #8e6c29 !important;
          cursor: pointer;
        }

        @media(max-width:850px) {
          .bd-grid {
            grid-template-columns: 1fr !important;
          }

          .bd-map-wrap {
            min-height: 420px !important;
          }

          .bd-panel {
            position: relative !important;
            top: auto !important;
          }

          .bd-top-actions {
            display: none !important;
          }

          .bd-mobile-toggle {
            display: flex !important;
          }

          .bd-stats {
            grid-template-columns: 1fr !important;
          }
        }

        @media(min-width:851px) {
          .bd-mobile-toggle {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px",
        }}
      >
        {/* HEADER */}

        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "4px 2px 18px",
            borderBottom: `1px solid ${ui.line}`,
          }}
        >
          <div>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                border: 0,
                background: "transparent",
                color: ui.text,
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 950,
                  letterSpacing: "-.7px",
                }}
              >
                SAMBHAV{" "}
                <span style={{ color: ui.gold }}>
                  UPSC
                </span>
              </div>

              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "1.7px",
                  color: ui.muted,
                  marginTop: 3,
                  fontWeight: 800,
                }}
              >
                BHARAT DARSHAN
              </div>
            </button>
          </div>

          <div
            className="bd-top-actions"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "9px 12px",
                borderRadius: 999,
                background: ui.surface,
                border: `1px solid ${ui.line}`,
                fontSize: 9,
                fontWeight: 800,
                color: ui.muted,
              }}
            >
              EXPLORE INDIA • LEARN INDIA • MASTER INDIA
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <button
              onClick={() => {
                const next =
                  theme === "dark"
                    ? "light"
                    : "dark";

                setTheme(next);

                try {
                  localStorage.setItem(
                    "sambhav-theme",
                    next
                  );
                } catch {}
              }}
              style={{
                border: `1px solid ${ui.line}`,
                background: ui.surface,
                color: ui.text,
                borderRadius: 12,
                padding: "9px 11px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                border: `1px solid ${ui.line}`,
                background: ui.surface,
                color: ui.text,
                borderRadius: 12,
                padding: "9px 12px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              ← Home
            </button>
          </div>
        </header>

        {/* HERO */}

        <section
          style={{
            padding: "26px 0 18px",
          }}
        >
          <div
            style={{
              color: ui.gold,
              fontSize: 9,
              fontWeight: 950,
              letterSpacing: "1.8px",
            }}
          >
            MAP INTELLIGENCE FOR UPSC
          </div>

          <h1
            style={{
              fontSize: "clamp(30px,5vw,54px)",
              lineHeight: 1,
              letterSpacing: "-1.8px",
              margin: "9px 0 10px",
              fontWeight: 950,
            }}
          >
            Bharat Darshan
          </h1>

          <p
            style={{
              color: ui.muted,
              maxWidth: 760,
              margin: 0,
              lineHeight: 1.65,
              fontSize: 13,
            }}
          >
            See India → Understand India → Recall
            India → Master India for UPSC Prelims and
            GS Geography.
          </p>
        </section>

        {/* MODES */}

        <div
          className="bd-scroll"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 12,
          }}
        >
          {MODES.map(([id, title, sub]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              style={{
                flex: "0 0 auto",
                textAlign: "left",
                border: `1px solid ${
                  mode === id ? ui.gold : ui.line
                }`,
                background:
                  mode === id
                    ? theme === "dark"
                      ? "#27231a"
                      : "#f0e7d2"
                    : ui.surface,
                color: ui.text,
                borderRadius: 13,
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                {title}
              </div>

              <div
                style={{
                  fontSize: 8,
                  color: ui.muted,
                  marginTop: 3,
                }}
              >
                {sub}
              </div>
            </button>
          ))}
        </div>

        {/* REGION + SEARCH */}

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          {REGIONS.map((item) => (
            <button
              key={item}
              onClick={() => setRegion(item)}
              style={{
                border: `1px solid ${
                  region === item
                    ? ui.gold
                    : ui.line
                }`,
                background:
                  region === item
                    ? ui.gold
                    : ui.surface,
                color:
                  region === item
                    ? "#111"
                    : ui.text,
                borderRadius: 999,
                padding: "7px 11px",
                fontSize: 9,
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}

          <div
            style={{
              flex: 1,
              minWidth: 220,
            }}
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search state, river, mountain, park, crop, mineral..."
              style={{
                width: "100%",
                border: `1px solid ${ui.line}`,
                background: ui.surface,
                color: ui.text,
                borderRadius: 999,
                padding: "9px 13px",
                outline: "none",
                fontSize: 10,
              }}
            />
          </div>
        </div>

        {/* MAP + EXPLORER */}

        <div
          className="bd-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1.45fr) minmax(330px,.75fr)",
            gap: 14,
            alignItems: "start",
          }}
        >
          {/* MAP */}

          <section
            className="bd-card bd-map-wrap"
            style={{
              background: ui.surface,
              border: `1px solid ${ui.line}`,
              borderRadius: 22,
              minHeight: 590,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                padding: "15px 16px",
                borderBottom:
                  `1px solid ${ui.line}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  Interactive India Map
                </div>

                <div
                  style={{
                    fontSize: 8,
                    color: ui.muted,
                    marginTop: 3,
                  }}
                >
                  Click a verified state/UT polygon
                  to explore.
                </div>
              </div>

              <div
                style={{
                  fontSize: 8,
                  color: ui.muted,
                }}
              >
                {loadingMap
                  ? "Loading boundaries…"
                  : `${filteredFeatures.length} mapped regions`}
              </div>
            </div>

            <div
              style={{
                padding: 12,
                height: 510,
                background: ui.map,
              }}
            >
              {loadingMap ? (
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    color: ui.muted,
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 26,
                      }}
                    >
                      ◌
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontWeight: 900,
                        color: ui.text,
                      }}
                    >
                      Loading India map…
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 10,
                      }}
                    >
                      Loading verified polygon
                      boundaries.
                    </div>
                  </div>
                </div>
              ) : geoError ? (
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    color: ui.muted,
                    padding: 30,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 26,
                      }}
                    >
                      ◌
                    </div>

                    <div
                      style={{
                        fontWeight: 900,
                        color: ui.text,
                        marginTop: 8,
                      }}
                    >
                      Location data unavailable
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        marginTop: 6,
                      }}
                    >
                      {geoError}
                    </div>
                  </div>
                </div>
              ) : (
                <svg
                  className="bd-map"
                  viewBox="0 0 720 620"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label="Interactive India administrative map"
                >
                  <rect
                    width="720"
                    height="620"
                    fill="transparent"
                  />

                  {features.map(
                    ({
                      feature,
                      id,
                      name,
                    }) => {
                      if (!id) return null;

                      const meta =
                        STATE_META[id];

                      const visible =
                        filteredFeatures.some(
                          (item) =>
                            item.id === id
                        );

                      const isSelected =
                        selectedId === id;

                      return (
                        <path
                          key={id}
                          d={geometryPath(
                            feature.geometry,
                            720,
                            620
                          )}
                          fill={
                            isSelected
                              ? ui.gold
                              : visible
                              ? theme === "dark"
                                ? "#242424"
                                : "#ddd9ce"
                              : theme === "dark"
                              ? "#111"
                              : "#e8e5dd"
                          }
                          stroke={
                            isSelected
                              ? "#8e6c29"
                              : theme === "dark"
                              ? "#686868"
                              : "#aaa69c"
                          }
                          strokeWidth={
                            isSelected
                              ? 2.1
                              : 1.1
                          }
                          onClick={() =>
                            selectState(id)
                          }
                          aria-label={
                            meta?.name || name
                          }
                        />
                      );
                    }
                  )}
                </svg>
              )}
            </div>

            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                justifyContent:
                  "space-between",
                color: ui.muted,
                fontSize: 8,
                borderTop:
                  `1px solid ${ui.line}`,
              }}
            >
              <span>
                Stable State/UT mapping
              </span>

              <span>
                Verified polygon geometry
              </span>
            </div>
          </section>

          {/* STATE EXPLORER */}

          <aside
            className="bd-panel"
            style={{
              position: "sticky",
              top: 12,
              background: ui.surface,
              border: `1px solid ${ui.line}`,
              borderRadius: 22,
              overflow: "hidden",
            }}
          >
            <button
              className="bd-mobile-toggle"
              onClick={() =>
                setMobilePanel(
                  (value) => !value
                )
              }
              style={{
                width: "100%",
                display: "none",
                justifyContent:
                  "space-between",
                border: 0,
                borderBottom:
                  `1px solid ${ui.line}`,
                background: ui.surface,
                color: ui.text,
                padding: 14,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              State Explorer

              <span>
                {mobilePanel ? "−" : "+"}
              </span>
            </button>

            <div
              style={{
                padding: 17,
                display:
                  mobilePanel
                    ? "block"
                    : undefined,
              }}
            >
              <div
                style={{
                  color: ui.gold,
                  fontSize: 8,
                  letterSpacing: "1.4px",
                  fontWeight: 900,
                }}
              >
                STATE EXPLORER
              </div>

              <h2
                style={{
                  fontSize: 24,
                  margin: "7px 0 5px",
                  letterSpacing: "-.7px",
                }}
              >
                {selectedName}
              </h2>

              {selected ? (
                <div
                  style={{
                    fontSize: 9,
                    color: ui.muted,
                  }}
                >
                  {selected.region} • Capital:{" "}
                  {selected.capital}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 10,
                    color: ui.muted,
                  }}
                >
                  Map par state/UT select karein.
                </div>
              )}

              {selected && (
                <>
                  {/* TABS */}

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 14,
                    }}
                  >
                    {[
                      ["overview", "Overview"],
                      ["facts", "UPSC Facts"],
                      ["recall", "Recall"],
                    ].map(
                      ([id, label]) => (
                        <button
                          key={id}
                          onClick={() =>
                            setTab(id)
                          }
                          style={{
                            flex: 1,
                            border: `1px solid ${
                              tab === id
                                ? ui.gold
                                : ui.line
                            }`,
                            background:
                              tab === id
                                ? ui.gold
                                : ui.surface2,
                            color:
                              tab === id
                                ? "#111"
                                : ui.text,
                            borderRadius: 10,
                            padding: "8px 4px",
                            fontSize: 8,
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>

                  {/* OVERVIEW */}

                  {tab === "overview" && (
                    <div
                      style={{
                        marginTop: 15,
                      }}
                    >
                      <InfoGroup
                        label="Rivers / Water"
                        items={selected.rivers}
                        ui={ui}
                      />

                      <InfoGroup
                        label="Relief / Mountains / Passes"
                        items={selected.relief}
                        ui={ui}
                      />

                      <InfoGroup
                        label="Ecology"
                        items={selected.ecology}
                        ui={ui}
                      />

                      <InfoGroup
                        label="Agriculture"
                        items={selected.crops}
                        ui={ui}
                      />

                      <InfoGroup
                        label="Minerals / Resources"
                        items={selected.minerals}
                        ui={ui}
                      />

                      <InfoGroup
                        label="Important Places"
                        items={selected.places}
                        ui={ui}
                      />
                    </div>
                  )}

                  {/* FACTS */}

                  {tab === "facts" && (
                    <div
                      style={{
                        marginTop: 15,
                      }}
                    >
                      <div
                        style={{
                          background:
                            ui.surface2,
                          border: `1px solid ${ui.line}`,
                          borderRadius: 15,
                          padding: 13,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 900,
                            color: ui.gold,
                          }}
                        >
                          UPSC IMPORTANCE
                        </div>

                        <p
                          style={{
                            margin:
                              "8px 0 0",
                            fontSize: 10,
                            lineHeight: 1.65,
                            color: ui.muted,
                          }}
                        >
                          Use this profile for
                          map-location questions,
                          river/relief
                          associations,
                          ecology,
                          agriculture,
                          minerals and
                          state-based
                          elimination in
                          Prelims.
                        </p>
                      </div>

                      <div
                        style={{
                          marginTop: 9,
                          background:
                            ui.surface2,
                          border: `1px solid ${ui.line}`,
                          borderRadius: 15,
                          padding: 13,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 900,
                            color: ui.gold,
                          }}
                        >
                          CLIMATE & MONSOON
                        </div>

                        <div
                          style={{
                            marginTop: 7,
                            fontSize: 10,
                            color: ui.muted,
                            lineHeight: 1.6,
                          }}
                        >
                          {selected.climate}
                        </div>
                      </div>

                      {modeItems && (
                        <div
                          style={{
                            marginTop: 9,
                            background:
                              ui.surface2,
                            border: `1px solid ${ui.line}`,
                            borderRadius: 15,
                            padding: 13,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 900,
                              color: ui.gold,
                            }}
                          >
                            {modeItems[0]}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexWrap:
                                "wrap",
                              gap: 5,
                              marginTop: 8,
                            }}
                          >
                            {modeItems[1].map(
                              (item) => (
                                <span
                                  key={item}
                                  style={{
                                    padding:
                                      "6px 7px",
                                    borderRadius:
                                      8,
                                    background:
                                      ui.surface,
                                    border: `1px solid ${ui.line}`,
                                    fontSize: 8,
                                  }}
                                >
                                  {item}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RECALL */}

                  {tab === "recall" && (
                    <div
                      style={{
                        marginTop: 15,
                      }}
                    >
                      <div
                        style={{
                          border: `1px solid ${ui.line}`,
                          background:
                            ui.surface2,
                          borderRadius: 16,
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: ui.gold,
                            fontWeight: 900,
                          }}
                        >
                          ACTIVE RECALL
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 13,
                            fontWeight: 850,
                          }}
                        >
                          Name two map facts you
                          can recall for{" "}
                          {selected.name}.
                        </div>

                        <button
                          onClick={() =>
                            setRecallRevealed(
                              true
                            )
                          }
                          style={{
                            marginTop: 13,
                            width: "100%",
                            border: `1px solid ${ui.line}`,
                            background:
                              ui.surface,
                            color: ui.text,
                            borderRadius: 11,
                            padding: 10,
                            fontWeight: 850,
                            cursor: "pointer",
                          }}
                        >
                          {recallRevealed
                            ? "Answer revealed"
                            : "Reveal answer"}
                        </button>

                        {recallRevealed && (
                          <div
                            style={{
                              marginTop: 10,
                              color: ui.muted,
                              fontSize: 10,
                              lineHeight: 1.6,
                            }}
                          >
                            {selected.rivers
                              .slice(0, 2)
                              .join(" and ")}
                            ;{" "}
                            {selected.relief
                              .slice(0, 2)
                              .join(" and ")}
                            .
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setRecallRevealed(
                            false
                          );

                          setRecallIndex(
                            (value) =>
                              value + 1
                          );
                        }}
                        style={{
                          marginTop: 8,
                          width: "100%",
                          border: 0,
                          background: ui.gold,
                          color: "#111",
                          borderRadius: 11,
                          padding: 10,
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Next Recall →
                      </button>
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      marginTop: 14,
                    }}
                  >
                    <button
                      onClick={markMastered}
                      style={{
                        flex: 1,
                        border: 0,
                        background: ui.gold,
                        color: "#111",
                        borderRadius: 11,
                        padding: 10,
                        fontSize: 9,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      ✓ Mark Mastered
                    </button>

                    <button
                      onClick={() => {
                        setCompareId(
                          compareId ||
                            Object.keys(
                              STATE_META
                            ).find(
                              (id) =>
                                id !==
                                selectedId
                            ) ||
                            null
                        );

                        setCompareOpen(true);
                      }}
                      style={{
                        flex: 1,
                        border: `1px solid ${ui.line}`,
                        background:
                          ui.surface2,
                        color: ui.text,
                        borderRadius: 11,
                        padding: 10,
                        fontSize: 9,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      Compare
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 9,
                      fontSize: 8,
                      color: ui.muted,
                    }}
                  >
                    Status:{" "}
                    <b
                      style={{
                        color: ui.text,
                      }}
                    >
                      {progress[selectedId]
                        ?.status ||
                        "Not Started"}
                    </b>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        {/* STATS */}

        <section
          className="bd-stats"
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 12,
          }}
        >
          <StatCard
            ui={ui}
            label="States / UTs in knowledge base"
            value={totalStates}
          />

          <StatCard
            ui={ui}
            label="Mastered"
            value={masteredCount}
          />

          <StatCard
            ui={ui}
            label="Learning / Revision"
            value={learningCount}
          />
        </section>

        {/* MAP QUIZ */}

        <section
          style={{
            marginTop: 16,
            background: ui.surface,
            border: `1px solid ${ui.line}`,
            borderRadius: 22,
            padding: 17,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: ui.gold,
                  fontSize: 8,
                  fontWeight: 900,
                  letterSpacing: "1.4px",
                }}
              >
                MAP QUIZ
              </div>

              <h2
                style={{
                  margin: "6px 0 0",
                  fontSize: 22,
                }}
              >
                Test your India map
                intelligence
              </h2>
            </div>

            {!quizStarted ? (
              <button
                onClick={() =>
                  setQuizStarted(true)
                }
                style={{
                  border: 0,
                  background: ui.gold,
                  color: "#111",
                  borderRadius: 12,
                  padding: "10px 15px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Start Quiz
              </button>
            ) : (
              <div
                style={{
                  fontSize: 10,
                  color: ui.muted,
                }}
              >
                Score:{" "}
                <b
                  style={{
                    color: ui.text,
                  }}
                >
                  {quizScore}/{QUIZ.length}
                </b>
              </div>
            )}
          </div>

          {quizStarted && (
            <div
              style={{
                marginTop: 16,
                background: ui.surface2,
                border: `1px solid ${ui.line}`,
                borderRadius: 16,
                padding: 15,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: ui.muted,
                }}
              >
                Question{" "}
                {quizIndex + 1} /{" "}
                {QUIZ.length}
              </div>

              <div
                style={{
                  marginTop: 9,
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                {currentQuiz.q}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",
                  gap: 8,
                  marginTop: 13,
                }}
              >
                {currentQuiz.options.map(
                  (option, index) => {
                    const chosen =
                      quizAnswer === index;

                    const correct =
                      currentQuiz.answer ===
                      index;

                    const bg =
                      quizAnswered &&
                      correct
                        ? "#dcebd9"
                        : quizAnswered &&
                          chosen
                        ? "#f0d8d8"
                        : ui.surface;

                    return (
                      <button
                        key={option}
                        onClick={() =>
                          answerQuiz(index)
                        }
                        style={{
                          textAlign: "left",
                          border: `1px solid ${
                            chosen ||
                            (quizAnswered &&
                              correct)
                              ? ui.gold
                              : ui.line
                          }`,
                          background: bg,
                          color: "#111",
                          borderRadius: 11,
                          padding: 11,
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: quizAnswered
                            ? "default"
                            : "pointer",
                        }}
                      >
                        {String.fromCharCode(
                          65 + index
                        )}
                        . {option}
                      </button>
                    );
                  }
                )}
              </div>

              {quizAnswered && (
                <>
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 10,
                      color: ui.muted,
                      lineHeight: 1.55,
                    }}
                  >
                    <b
                      style={{
                        color: ui.text,
                      }}
                    >
                      Explanation:
                    </b>{" "}
                    {currentQuiz.explanation}
                  </div>

                  <button
                    onClick={nextQuiz}
                    style={{
                      marginTop: 12,
                      border: 0,
                      background: ui.gold,
                      color: "#111",
                      borderRadius: 11,
                      padding: "9px 14px",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Next Question →
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* GLOBAL ACTIVE RECALL */}

        <section
          style={{
            marginTop: 16,
            background: ui.surface,
            border: `1px solid ${ui.line}`,
            borderRadius: 22,
            padding: 17,
          }}
        >
          <div
            style={{
              color: ui.gold,
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: "1.4px",
            }}
          >
            ACTIVE RECALL
          </div>

          <h2
            style={{
              margin: "6px 0 4px",
              fontSize: 22,
            }}
          >
            Learn → Recall → Revise
          </h2>

          <p
            style={{
              margin: 0,
              color: ui.muted,
              fontSize: 10,
              lineHeight: 1.55,
            }}
          >
            Ek location ko dekhkar answer
            yaad karo, phir reveal karke apni
            recall accuracy judge karo.
          </p>

          <div
            style={{
              marginTop: 13,
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1fr) auto",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                border: `1px solid ${ui.line}`,
                background: ui.surface2,
                borderRadius: 14,
                padding: 13,
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  color: ui.gold,
                  fontWeight: 900,
                }}
              >
                {currentRecall.title}
              </div>

              <div
                style={{
                  marginTop: 7,
                  fontSize: 11,
                  fontWeight: 850,
                }}
              >
                {currentRecall.prompt}
              </div>

              {recallRevealed && (
                <div
                  style={{
                    marginTop: 7,
                    fontSize: 9,
                    color: ui.muted,
                  }}
                >
                  {currentRecall.answer}
                </div>
              )}
            </div>

            <button
              onClick={() =>
                setRecallRevealed(
                  (value) => !value
                )
              }
              style={{
                border: 0,
                background: ui.gold,
                color: "#111",
                borderRadius: 11,
                padding: "10px 13px",
                fontSize: 9,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {recallRevealed
                ? "Hide"
                : "Reveal"}
            </button>
          </div>

          <button
            onClick={() => {
              setRecallIndex(
                (value) => value + 1
              );

              setRecallRevealed(false);
            }}
            style={{
              marginTop: 9,
              border: `1px solid ${ui.line}`,
              background: ui.surface,
              color: ui.text,
              borderRadius: 11,
              padding: "9px 12px",
              fontSize: 9,
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            Next Recall →
          </button>
        </section>

        <footer
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: `1px solid ${ui.line}`,
            color: ui.muted,
            fontSize: 8,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            SAMBHAV UPSC • Bharat Darshan
          </span>

          <span>
            Static geography and user progress
            are separate from Current Affairs.
          </span>
        </footer>
      </div>

      {/* COMPARISON MODAL */}

      {compareOpen && selected && (
        <div
          onClick={() =>
            setCompareOpen(false)
          }
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.58)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="bd-scroll"
            style={{
              width: "min(920px,100%)",
              maxHeight: "90vh",
              overflow: "auto",
              background: ui.surface,
              color: ui.text,
              border: `1px solid ${ui.line}`,
              borderRadius: 22,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    color: ui.gold,
                    fontSize: 8,
                    fontWeight: 900,
                  }}
                >
                  STATE COMPARISON
                </div>

                <h2
                  style={{
                    margin: "5px 0 0",
                    fontSize: 22,
                  }}
                >
                  {selected.name} vs{" "}
                  {STATE_META[compareId]
                    ?.name ||
                    "Select state"}
                </h2>
              </div>

              <button
                onClick={() =>
                  setCompareOpen(false)
                }
                style={{
                  border: `1px solid ${ui.line}`,
                  background:
                    ui.surface2,
                  color: ui.text,
                  borderRadius: 10,
                  padding: "8px 11px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <select
              value={compareId || ""}
              onChange={(event) =>
                setCompareId(
                  event.target.value
                )
              }
              style={{
                marginTop: 14,
                width: "100%",
                border: `1px solid ${ui.line}`,
                background: ui.surface2,
                color: ui.text,
                borderRadius: 11,
                padding: 10,
              }}
            >
              <option value="">
                Select comparison state
              </option>

              {Object.entries(
                STATE_META
              )
                .filter(
                  ([id]) =>
                    id !== selectedId
                )
                .map(([id, value]) => (
                  <option
                    key={id}
                    value={id}
                  >
                    {value.name}
                  </option>
                ))}
            </select>

            {compareId &&
              STATE_META[compareId] && (
                <div
                  style={{
                    marginTop: 14,
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse:
                        "collapse",
                      fontSize: 9,
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={th(ui)}>
                          Dimension
                        </th>

                        <th style={th(ui)}>
                          {selected.name}
                        </th>

                        <th style={th(ui)}>
                          {
                            STATE_META[
                              compareId
                            ].name
                          }
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {[
                        [
                          "Rivers",
                          selected.rivers,
                          STATE_META[
                            compareId
                          ].rivers,
                        ],
                        [
                          "Relief",
                          selected.relief,
                          STATE_META[
                            compareId
                          ].relief,
                        ],
                        [
                          "Agriculture",
                          selected.crops,
                          STATE_META[
                            compareId
                          ].crops,
                        ],
                        [
                          "Ecology",
                          selected.ecology,
                          STATE_META[
                            compareId
                          ].ecology,
                        ],
                        [
                          "Minerals",
                          selected.minerals,
                          STATE_META[
                            compareId
                          ].minerals,
                        ],
                        [
                          "Places",
                          selected.places,
                          STATE_META[
                            compareId
                          ].places,
                        ],
                      ].map(
                        ([label, a, b]) => (
                          <tr key={label}>
                            <td
                              style={td(
                                ui,
                                true
                              )}
                            >
                              {label}
                            </td>

                            <td
                              style={td(ui)}
                            >
                              {a.join(", ")}
                            </td>

                            <td
                              style={td(ui)}
                            >
                              {b.join(", ")}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      )}
    </main>
  );
}

function InfoGroup({
  label,
  items,
  ui,
}) {
  return (
    <div
      style={{
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 8,
          color: ui.gold,
          fontWeight: 900,
          letterSpacing: ".8px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          marginTop: 6,
        }}
      >
        {items.map((item) => (
          <span
            key={item}
            style={{
              padding: "6px 7px",
              borderRadius: 8,
              background: ui.surface2,
              border: `1px solid ${ui.line}`,
              fontSize: 8,
              color: ui.text,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  ui,
  label,
  value,
}) {
  return (
    <div
      style={{
        background: ui.surface,
        border: `1px solid ${ui.line}`,
        borderRadius: 17,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 8,
          color: ui.muted,
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 23,
          fontWeight: 950,
          color: ui.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function th(ui) {
  return {
    textAlign: "left",
    padding: 10,
    borderBottom:
      `1px solid ${ui.line}`,
    color: ui.gold,
  };
}

function td(ui, bold = false) {
  return {
    padding: 10,
    borderBottom:
      `1px solid ${ui.line}`,
    color: ui.muted,
    verticalAlign: "top",
    fontWeight: bold ? 900 : 500,
  };
}
