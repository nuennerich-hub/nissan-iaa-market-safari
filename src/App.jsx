import React, { useEffect, useMemo, useState } from "react";

const SUPABASE_URL = "https://dgxjskzvvuhcotaqeyid.supabase.co";
const SUPABASE_KEY =
  "sb_publishable_ILLsjgmMxXyWD-hSzjRFwQ_9PVd8X0o";

const TABLE = "market_safari_results";

/*
===========================================
ROUTING LOGIK
===========================================

Teilnehmer:
https://deine-app.vercel.app

Trainer:
https://deine-app.vercel.app/trainer
*/

const currentPath =
  typeof window !== "undefined"
    ? window.location.pathname
    : "/";

const defaultView =
  currentPath === "/trainer"
    ? "trainer"
    : "participant";

export default function App() {
  const competitors = [
    "Ford Pro",
    "Mercedes-Benz Vans",
    "Volkswagen Nutzfahrzeuge",
    "Renault Pro+",
    "MAXUS",
    "BYD",
    "Toyota Professional",
    "KIA PBV",
    "FIAT Professional",
    "Opel Nutzfahrzeuge",
    "Peugeot Professional",
    "Citroën Business",
    "IVECO Daily",
    "Nissan Nutzfahrzeuge",
  ];

  const groups = [
    "Gruppe 1",
    "Gruppe 2",
    "Gruppe 3",
    "Gruppe 4",
    "Gruppe 5",
  ];

  const questions = [
    {
      key: "branche",
      title: "Welche Zielbranche adressiert dieser OEM?",
      hint: "z. B. Handwerk, Logistik, Kommune, Serviceflotten",
    },
    {
      key: "usecases",
      title: "Welche Anwendungsfälle stehen sichtbar im Fokus?",
      hint: "z. B. mobile Werkstatt, City-Logistik, Kühltransport",
    },
    {
      key: "segmente",
      title:
        "Welche Flotten- oder Gewerbesegmente werden offensiv angesprochen?",
      hint: "z. B. Handwerk, KEP, Kommune, Großkunden",
    },
    {
      key: "chance",
      title:
        "Wo liegen weiße Flecken, die Nissan besetzen könnte?",
      hint: "Welche Chancen oder strategischen Lücken erkennt ihr?",
    },
  ];

  const ratingCriteria = [
    {
      key: "rating_professionalitaet",
      label: "Professioneller Messeauftritt",
    },
    {
      key: "rating_innovation",
      label: "Innovationsgrad / Zukunftswirkung",
    },
    {
      key: "rating_vertriebslogik",
      label: "Business- & Vertriebslogik",
    },
  ];

  const initialAnswers = questions.reduce((acc, q) => {
    acc[q.key] = "";
    return acc;
  }, {});

  const initialRatings = ratingCriteria.reduce((acc, r) => {
    acc[r.key] = 3;
    return acc;
  }, {});

  const [view] = useState(defaultView);

  const [sessionName, setSessionName] =
    useState("IAA Market Safari");

  const [selectedGroup, setSelectedGroup] =
    useState("Gruppe 1");

  const [selectedCompetitor, setSelectedCompetitor] =
    useState("Ford Pro");

  const [answers, setAnswers] =
    useState(initialAnswers);

  const [learning, setLearning] =
    useState("");

  const [ratings, setRatings] =
    useState(initialRatings);

  const [submitted, setSubmitted] =
    useState(false);

  const [submissions, setSubmissions] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  async function fetchResults() {
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?session_name=eq.${encodeURIComponent(
      sessionName
    )}&select=*&order=created_at.desc`;

    const response = await fetch(url, {
      headers,
    });

    const data = await response.json();

    setSubmissions(data || []);
  }

  useEffect(() => {
    fetchResults();

    if (view === "trainer") {
      const interval = setInterval(fetchResults, 4000);

      return () => clearInterval(interval);
    }
  }, [view, sessionName]);

  const updateAnswer = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateRating = (key, value) => {
    setRatings((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  async function submitResult() {
    setLoading(true);

    const payload = {
      session_name: sessionName,
      group_name: selectedGroup,
      competitor: selectedCompetitor,

      branche: answers.branche,
      usecases: answers.usecases,
      segmente: answers.segmente,
      chance: answers.chance,

      learning,

      rating_professionalitaet:
        ratings.rating_professionalitaet,

      rating_innovation:
        ratings.rating_innovation,

      rating_vertriebslogik:
        ratings.rating_vertriebslogik,
    };

    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    setSubmitted(true);

    setLoading(false);
  }

  async function resetAllSubmissions() {
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?session_name=eq.${encodeURIComponent(
      sessionName
    )}`;

    await fetch(url, {
      method: "DELETE",
      headers,
    });

    fetchResults();
  }

  const averageRating = (item) => {
    const values = [
      Number(item.rating_professionalitaet || 0),
      Number(item.rating_innovation || 0),
      Number(item.rating_vertriebslogik || 0),
    ];

    return (
      values.reduce((a, b) => a + b, 0) /
      values.length
    );
  };

  const ranking = useMemo(() => {
    return [...submissions].sort(
      (a, b) =>
        averageRating(b) - averageRating(a)
    );
  }, [submissions]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111]">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* HEADER */}

        <header className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">

          <div className="bg-[#c3002f] h-2 w-full" />

          <div className="p-6 md:p-8">

            <div className="flex items-center gap-5">

              <img
                src="/new-Nissan-logo-black-png-large-size.png"
                alt="Nissan Logo"
                className="h-14 md:h-20 w-auto"
              />

              <div>

                <div className="uppercase tracking-[0.3em] text-xs font-bold text-[#c3002f]">
                  Nissan Internal
                </div>

                <h1 className="text-3xl md:text-5xl font-black mt-3">
                  IAA Market Safari
                </h1>

                <p className="text-gray-600 mt-3 text-base md:text-lg">
                  Guided Competitive Learning ·
                  Nutzfahrzeuge bis 3,5 t
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* PARTICIPANT */}

        {view === "participant" && (
          <main className="space-y-5">

            <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6">

              <div className="grid md:grid-cols-3 gap-4">

                <div>
                  <label className="block font-semibold mb-2">
                    Session
                  </label>

                  <input
                    className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50"
                    value={sessionName}
                    onChange={(e) =>
                      setSessionName(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">
                    Gruppe
                  </label>

                  <select
                    className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50"
                    value={selectedGroup}
                    onChange={(e) =>
                      setSelectedGroup(e.target.value)
                    }
                  >
                    {groups.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">
                    Wettbewerber
                  </label>

                  <select
                    className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50"
                    value={selectedCompetitor}
                    onChange={(e) =>
                      setSelectedCompetitor(
                        e.target.value
                      )
                    }
                  >
                    {competitors.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

              </div>

            </section>

            {!submitted ? (
              <>
                {questions.map((q, index) => (
                  <section
                    key={q.key}
                    className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start gap-4">

                      <div className="min-w-[52px] h-[52px] rounded-2xl bg-[#c3002f] text-white flex items-center justify-center text-2xl font-black">
                        {index + 1}
                      </div>

                      <div className="flex-1">

                        <h3 className="text-2xl font-bold">
                          {q.title}
                        </h3>

                        <p className="text-gray-500 mt-2">
                          {q.hint}
                        </p>

                      </div>

                    </div>

                    <textarea
                      value={answers[q.key]}
                      onChange={(e) =>
                        updateAnswer(
                          q.key,
                          e.target.value
                        )
                      }
                      placeholder="Antworten als Stichpunkte eintragen …"
                      className="mt-6 w-full min-h-[140px] rounded-[24px] border border-gray-300 bg-gray-50 p-5"
                    />

                  </section>
                ))}

                <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6">

                  <h3 className="text-3xl font-black">
                    Bewertung
                  </h3>

                  <div className="space-y-6 mt-6">

                    {ratingCriteria.map((r) => (
                      <div key={r.key}>

                        <div className="flex justify-between">

                          <div className="font-bold">
                            {r.label}
                          </div>

                          <div className="font-black text-[#c3002f]">
                            {ratings[r.key]}
                          </div>

                        </div>

                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={ratings[r.key]}
                          onChange={(e) =>
                            updateRating(
                              r.key,
                              e.target.value
                            )
                          }
                          className="w-full mt-3 accent-[#c3002f]"
                        />

                      </div>
                    ))}

                  </div>

                </section>

                <section className="bg-[#111] text-white rounded-[32px] p-6">

                  <h3 className="text-3xl font-black">
                    Wichtigstes Learning
                  </h3>

                  <textarea
                    value={learning}
                    onChange={(e) =>
                      setLearning(e.target.value)
                    }
                    placeholder="Was sollte Nissan lernen?"
                    className="mt-6 w-full min-h-[120px] rounded-[24px] border border-gray-700 bg-[#2b2b2b] p-5"
                  />

                  <div className="flex justify-end mt-6">

                    <button
                      onClick={submitResult}
                      disabled={loading}
                      className="bg-[#c3002f] text-white text-lg font-bold px-8 py-4 rounded-2xl"
                    >
                      Ergebnisse absenden
                    </button>

                  </div>

                </section>
              </>
            ) : (
              <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-10 text-center">

                <h2 className="text-5xl font-black">
                  Danke!
                </h2>

                <p className="text-gray-600 mt-4 text-lg">
                  Eure Ergebnisse wurden gespeichert.
                </p>

              </section>
            )}

          </main>
        )}

        {/* TRAINER */}

        {view === "trainer" && (
          <main className="space-y-6">

            <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6">

              <div className="flex justify-between items-center">

                <div>

                  <div className="uppercase tracking-[0.25em] text-xs font-bold text-[#c3002f]">
                    Trainer Dashboard
                  </div>

                  <h2 className="text-4xl font-black mt-2">
                    Live-Auswertung
                  </h2>

                </div>

                <button
                  onClick={resetAllSubmissions}
                  className="bg-[#c3002f] text-white px-6 py-3 rounded-2xl font-bold"
                >
                  Ergebnisse löschen
                </button>

              </div>

            </section>

            <section className="grid md:grid-cols-3 gap-4">

              {ranking.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6"
                >

                  <div className="text-sm text-gray-500">
                    {item.group_name}
                  </div>

                  <h3 className="text-2xl font-black mt-2">
                    {item.competitor}
                  </h3>

                  <div className="text-5xl font-black text-[#c3002f] mt-5">
                    {averageRating(item).toFixed(1)}
                  </div>

                  <div className="mt-4 border-t pt-4">

                    <div className="text-sm text-gray-500">
                      Learning
                    </div>

                    <p className="font-semibold mt-2">
                      {item.learning}
                    </p>

                  </div>

                </div>
              ))}

            </section>

          </main>
        )}
      </div>
    </div>
  );
}
