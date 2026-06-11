import React, { useEffect, useMemo, useState } from "react";

const SUPABASE_URL = "https://dgxjskzvvuhcotaqeyid.supabase.co";
const SUPABASE_KEY = "sb_publishable_ILLsjgmMxXyWD-hSzjRFwQ_9PVd8X0o";
const TABLE = "market_safari_results";

const currentPath =
  typeof window !== "undefined" ? window.location.pathname : "/";

const defaultView = currentPath === "/trainer" ? "trainer" : "participant";

export default function App() {
  const competitors = [
    "Ford Pro",
    "Toyota Professional",
    "Renault Nutzfahrzeuge",
    "KIA PBV",
    "Opel Nutzfahrzeuge",
  ];

  const groups = ["Gruppe 1", "Gruppe 2", "Gruppe 3", "Gruppe 4", "Gruppe 5"];

  const questions = [
    {
      key: "branche",
      title: "Welche Zielgruppe oder Branche wird besonders sichtbar angesprochen?",
      hint: "z. B. Handwerk, Logistik, Kommune, Serviceflotten",
    },
    {
      key: "usecases",
      title: "Welcher Bedarf / Anwendungsfall wird besonders deutlich adressiert?",
      hint: "Was möchte dieser Anbieter für seine Kunden vereinfachen oder verbessern?",
    },
    {
      key: "segmente",
      title: "Welche Lösung oder welcher Use-Case wird besonders überzeugend gezeigt?",
      hint: "z. B. Flottenlösung, Auf-/Umbau, EV-Konzept, digitaler Service",
    },
    {
      key: "chance",
      title: "Welchen Impuls nehmen Sie für Ihren Autohausalltag oder Ihre Akquise mit?",
      hint: "Welche Idee können Sie konkret in Kundengesprächen oder Akquise nutzen?",
    },
  ];

  const ratingCriteria = [
    {
      key: "rating_professionalitaet",
      label: "Zielgruppen-Klarheit",
      left: "kaum erkennbar",
      right: "sehr klar",
    },
    {
      key: "rating_innovation",
      label: "Nutzenorientierung",
      left: "produktorientiert",
      right: "kundenorientiert",
    },
    {
      key: "rating_vertriebslogik",
      label: "Praxisnähe",
      left: "theoretisch",
      right: "direkt anwendbar",
    },
  ];

  const initialAnswers = {
    branche: "",
    usecases: "",
    segmente: "",
    chance: "",
  };

  const initialRatings = {
    rating_professionalitaet: 3,
    rating_innovation: 3,
    rating_vertriebslogik: 3,
  };

  const [view] = useState(defaultView);
  const [sessionName, setSessionName] = useState("IAA Market Safari");
  const [selectedGroup, setSelectedGroup] = useState("Gruppe 1");
  const [selectedCompetitor, setSelectedCompetitor] = useState("Ford Pro");
  const [answers, setAnswers] = useState(initialAnswers);
  const [learning, setLearning] = useState("");
  const [ratings, setRatings] = useState(initialRatings);
  const [submitted, setSubmitted] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  async function fetchResults() {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${TABLE}?session_name=eq.${encodeURIComponent(
        sessionName
      )}&select=*&order=created_at.desc`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error("Ergebnisse konnten nicht geladen werden.");
      }

      const data = await response.json();
      setSubmissions(data || []);
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(error.message || "Fehler beim Laden der Ergebnisse.");
    }
  }

  useEffect(() => {
    fetchResults();

    if (view === "trainer") {
      const interval = setInterval(fetchResults, 4000);
      return () => clearInterval(interval);
    }
  }, [view, sessionName]);

  function updateAnswer(key, value) {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateRating(key, value) {
    setRatings((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  }

  async function submitResult() {
    try {
      setLoading(true);
      setStatusMessage("");

      const payload = {
        session_name: sessionName,
        group_name: selectedGroup,
        competitor: selectedCompetitor,
        branche: answers.branche,
        usecases: answers.usecases,
        segmente: answers.segmente,
        chance: answers.chance,
        learning,
        rating_professionalitaet: ratings.rating_professionalitaet,
        rating_innovation: ratings.rating_innovation,
        rating_vertriebslogik: ratings.rating_vertriebslogik,
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Absenden fehlgeschlagen. Bitte erneut versuchen.");
      }

      setSubmitted(true);
      await fetchResults();
    } catch (error) {
      setStatusMessage(error.message || "Fehler beim Absenden.");
    } finally {
      setLoading(false);
    }
  }

  async function resetAllSubmissions() {
    const confirmDelete = window.confirm(
      "Alle Ergebnisse dieser Session wirklich löschen?"
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      const url = `${SUPABASE_URL}/rest/v1/${TABLE}?session_name=eq.${encodeURIComponent(
        sessionName
      )}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Löschen fehlgeschlagen.");
      }

      await fetchResults();
    } catch (error) {
      setStatusMessage(error.message || "Fehler beim Löschen.");
    } finally {
      setLoading(false);
    }
  }

  function resetParticipantForm() {
    setAnswers(initialAnswers);
    setLearning("");
    setRatings(initialRatings);
    setSubmitted(false);
    setStatusMessage("");
  }

  function averageRating(item) {
    const values = [
      Number(item.rating_professionalitaet || 0),
      Number(item.rating_innovation || 0),
      Number(item.rating_vertriebslogik || 0),
    ];

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function avgByCriterion(key) {
    if (!submissions.length) return 0;
    const values = submissions.map((item) => Number(item[key] || 0));
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function exportPdf() {
    const date = new Date().toLocaleDateString("de-DE");
    const rows = submissions
      .map(
        (item) => `
          <section class="result-card">
            <h2>${item.group_name || ""} · ${item.competitor || ""}</h2>

            <h3>1. Zielgruppe / Branche</h3>
            <p>${escapeHtml(item.branche || "—")}</p>

            <h3>2. Bedarf / Anwendungsfall</h3>
            <p>${escapeHtml(item.usecases || "—")}</p>

            <h3>3. Lösung / Use-Case</h3>
            <p>${escapeHtml(item.segmente || "—")}</p>

            <h3>4. Impuls für Autohausalltag / Akquise</h3>
            <p>${escapeHtml(item.chance || "—")}</p>

            <h3>Persönliches Transfer-Learning</h3>
            <p>${escapeHtml(item.learning || "—")}</p>

            <div class="ratings">
              <div>Zielgruppen-Klarheit: <strong>${item.rating_professionalitaet || "—"}/5</strong></div>
              <div>Nutzenorientierung: <strong>${item.rating_innovation || "—"}/5</strong></div>
              <div>Praxisnähe: <strong>${item.rating_vertriebslogik || "—"}/5</strong></div>
              <div>Ø Bewertung: <strong>${averageRating(item).toFixed(1)}/5</strong></div>
            </div>
          </section>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
        <head>
          <title>IAA Market Safari Ergebnisse</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #111;
              margin: 40px;
              line-height: 1.45;
            }
            .topline {
              height: 8px;
              background: #c3002f;
              margin-bottom: 28px;
            }
            h1 {
              font-size: 32px;
              margin: 0 0 8px;
            }
            .meta {
              color: #555;
              margin-bottom: 32px;
            }
            .result-card {
              border: 1px solid #ddd;
              border-radius: 14px;
              padding: 22px;
              margin-bottom: 22px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            h2 {
              font-size: 22px;
              margin: 0 0 18px;
              color: #c3002f;
            }
            h3 {
              font-size: 14px;
              margin: 16px 0 4px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            p {
              margin: 0;
              white-space: pre-wrap;
            }
            .ratings {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              background: #f3f3f3;
              border-radius: 10px;
              padding: 12px;
              margin-top: 18px;
            }
            @media print {
              body {
                margin: 24px;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="topline"></div>
          <h1>IAA Market Safari – Ergebnisdokumentation</h1>
          <div class="meta">
            Session: ${escapeHtml(sessionName)}<br/>
            Datum: ${date}<br/>
            Anzahl Eingaben: ${submissions.length}
          </div>

          ${rows || "<p>Noch keine Ergebnisse vorhanden.</p>"}

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  const ranking = useMemo(() => {
    return [...submissions].sort((a, b) => averageRating(b) - averageRating(a));
  }, [submissions]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111]">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Header />

        {statusMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 font-semibold">
            {statusMessage}
          </div>
        )}

        {view === "participant" && (
          <ParticipantView
            groups={groups}
            competitors={competitors}
            questions={questions}
            ratingCriteria={ratingCriteria}
            sessionName={sessionName}
            setSessionName={setSessionName}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            selectedCompetitor={selectedCompetitor}
            setSelectedCompetitor={setSelectedCompetitor}
            answers={answers}
            updateAnswer={updateAnswer}
            ratings={ratings}
            updateRating={updateRating}
            learning={learning}
            setLearning={setLearning}
            submitted={submitted}
            submitResult={submitResult}
            loading={loading}
            resetParticipantForm={resetParticipantForm}
          />
        )}

        {view === "trainer" && (
          <TrainerView
            sessionName={sessionName}
            setSessionName={setSessionName}
            submissions={submissions}
            questions={questions}
            ratingCriteria={ratingCriteria}
            ranking={ranking}
            averageRating={averageRating}
            avgByCriterion={avgByCriterion}
            fetchResults={fetchResults}
            resetAllSubmissions={resetAllSubmissions}
            exportPdf={exportPdf}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-[#c3002f] h-2 w-full" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-5">
          <img
            src="/new-Nissan-logo-black-png-large-size.png"
            alt="Nissan Logo"
            className="h-16 md:h-24 w-auto object-contain"
          />

          <div>
            <div className="uppercase tracking-[0.3em] text-xs font-bold text-[#c3002f]">
              Nissan Internal
            </div>

            <h1 className="text-3xl md:text-5xl font-black mt-3">
              IAA Market Safari
            </h1>

            <p className="text-gray-600 mt-3 text-base md:text-lg">
              Guided Competitive Learning · Nutzfahrzeuge bis 3,5 t · Markt
              verstehen statt Fahrzeuge vergleichen
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function ParticipantView({
  groups,
  competitors,
  questions,
  ratingCriteria,
  sessionName,
  setSessionName,
  selectedGroup,
  setSelectedGroup,
  selectedCompetitor,
  setSelectedCompetitor,
  answers,
  updateAnswer,
  ratings,
  updateRating,
  learning,
  setLearning,
  submitted,
  submitResult,
  loading,
  resetParticipantForm,
}) {
  if (submitted) {
    return (
      <main className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8 md:p-12 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">
          ✓
        </div>

        <h2 className="text-3xl md:text-5xl font-black mt-6">Danke!</h2>

        <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">
          Eure Ergebnisse wurden gespeichert. Ihr könnt jetzt zur Gruppe
          zurückkehren.
        </p>

        <button
          onClick={resetParticipantForm}
          className="mt-8 bg-black text-white text-lg font-bold px-8 py-4 rounded-2xl"
        >
          Neue Eingabe starten
        </button>
      </main>
    );
  }

  return (
    <main className="grid lg:grid-cols-[380px_1fr] gap-6">
      <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 space-y-6 h-fit">
        <div>
          <div className="text-sm uppercase tracking-widest font-bold text-[#c3002f]">
            Setup
          </div>

          <h2 className="text-2xl font-bold mt-2">Gruppe & Anbieter</h2>
        </div>

        <div>
          <label className="block font-semibold mb-2 text-sm">Session</label>
          <input
            className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50 text-lg"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold mb-2 text-sm">Gruppe</label>
          <select
            className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50 text-lg"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2 text-sm">
            Beobachteter Anbieter
          </label>
          <select
            className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50 text-lg"
            value={selectedCompetitor}
            onChange={(e) => setSelectedCompetitor(e.target.value)}
          >
            {competitors.map((competitor) => (
              <option key={competitor}>{competitor}</option>
            ))}
          </select>
        </div>

        <div className="bg-[#111] text-white rounded-[28px] p-6">
          <div className="text-sm text-gray-300">Safari Ablauf</div>

          <div className="space-y-3 mt-4 text-lg">
  <div className="flex items-start gap-3">
    <span className="w-7 text-center shrink-0">⏱</span>
    <span>60 Minuten auf der Messe</span>
  </div>

  <div className="flex items-start gap-3">
    <span className="w-7 text-center shrink-0">📱</span>
    <span>Stichpunkte direkt am Handy</span>
  </div>

  <div className="flex items-start gap-3">
    <span className="w-7 text-center shrink-0">🎯</span>
    <span>Fokus auf Markt & Vertrieb</span>
  </div>

  <div className="flex items-start gap-3">
    <span className="w-7 text-center shrink-0">💡</span>
    <span>Impulse für Ihre Akquise</span>
  </div>
</div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="uppercase tracking-[0.25em] text-xs font-bold text-[#c3002f]">
            Beobachtungsauftrag
          </div>

          <h2 className="text-3xl md:text-4xl font-black mt-3">
            {selectedGroup}: {selectedCompetitor}
          </h2>

          <p className="text-gray-600 mt-3 text-lg">
            Beobachten Sie aus Verkäufersicht: Was lässt sich für Akquise,
            Beratung und Kundengespräche mitnehmen?
          </p>
        </div>

        {questions.map((question, index) => (
          <div
            key={question.key}
            className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <div className="min-w-[52px] h-[52px] rounded-2xl bg-[#c3002f] text-white flex items-center justify-center text-2xl font-black">
                {index + 1}
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-bold leading-snug">
                  {question.title}
                </h3>

                <p className="text-gray-500 mt-2 text-base">
                  {question.hint}
                </p>
              </div>
            </div>

            <textarea
              placeholder="Antworten als Stichpunkte eintragen …"
              className="mt-6 w-full min-h-[130px] rounded-[24px] border border-gray-300 bg-gray-50 p-5 text-lg focus:outline-none focus:ring-2 focus:ring-[#c3002f]"
              value={answers[question.key]}
              onChange={(e) => updateAnswer(question.key, e.target.value)}
            />
          </div>
        ))}

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="uppercase tracking-[0.25em] text-xs font-bold text-[#c3002f]">
            Kurze Einschätzung
          </div>

          <h3 className="text-3xl font-black mt-3">
            Wie nutzbar sind die Beobachtungen für Ihre Vertriebsarbeit?
          </h3>

          <div className="space-y-7 mt-7">
            {ratingCriteria.map((criterion) => (
              <div key={criterion.key}>
                <div className="flex justify-between items-end gap-4">
                  <label className="text-xl font-bold">{criterion.label}</label>

                  <div className="text-3xl font-black text-[#c3002f]">
                    {ratings[criterion.key]}
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="5"
                  value={ratings[criterion.key]}
                  onChange={(e) => updateRating(criterion.key, e.target.value)}
                  className="w-full mt-3 accent-[#c3002f]"
                />

                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{criterion.left}</span>
                  <span>{criterion.right}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#111] to-[#1e1e1e] text-white rounded-[32px] shadow-sm p-6 md:p-8">
          <div className="uppercase tracking-[0.25em] text-xs font-bold text-red-300">
            Persönliches Transfer-Learning
          </div>

          <h3 className="text-3xl font-black mt-3 leading-snug">
            Welche Idee, Zielgruppe oder Gesprächslogik möchten Sie künftig in
            Ihrer Akquise nutzen?
          </h3>

          <textarea
            placeholder="Persönliches Learning für den Vertriebsalltag …"
            className="mt-6 w-full min-h-[120px] rounded-[24px] border border-gray-700 bg-[#2b2b2b] p-5 text-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={learning}
            onChange={(e) => setLearning(e.target.value)}
          />

          <div className="flex justify-end mt-6">
            <button
              onClick={submitResult}
              disabled={loading}
              className="bg-[#c3002f] disabled:bg-gray-500 hover:bg-[#a10027] transition-colors text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-lg"
            >
              {loading ? "Wird gesendet …" : "Ergebnisse absenden"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrainerView({
  sessionName,
  setSessionName,
  submissions,
  questions,
  ratingCriteria,
  ranking,
  averageRating,
  avgByCriterion,
  fetchResults,
  resetAllSubmissions,
  exportPdf,
  loading,
}) {
  return (
    <main className="space-y-6">
      <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="uppercase tracking-[0.25em] text-xs font-bold text-[#c3002f]">
              Trainer Dashboard
            </div>

            <h2 className="text-3xl md:text-5xl font-black mt-3">
              Live-Auswertung
            </h2>

            <p className="text-gray-600 mt-3 text-lg">
              Ergebnisse nur für Trainer · Export der eingegebenen Gruppenergebnisse
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={fetchResults}
              disabled={loading}
              className="bg-black text-white font-bold px-6 py-3 rounded-2xl"
            >
              Aktualisieren
            </button>

            <button
              onClick={exportPdf}
              className="bg-white border border-black text-black font-bold px-6 py-3 rounded-2xl"
            >
              PDF exportieren
            </button>

            <button
              onClick={resetAllSubmissions}
              disabled={loading}
              className="bg-[#c3002f] text-white font-bold px-6 py-3 rounded-2xl"
            >
              Ergebnisse löschen
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[28px] shadow-sm border border-gray-200 p-5">
        <label className="block font-semibold mb-2 text-sm">
          Session anzeigen
        </label>

        <input
          className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50 text-lg"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-[28px] shadow-sm border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Eingaben</div>
          <div className="text-4xl font-black mt-2">{submissions.length}</div>
        </div>

        {ratingCriteria.map((criterion) => (
          <div
            key={criterion.key}
            className="bg-white rounded-[28px] shadow-sm border border-gray-200 p-5"
          >
            <div className="text-sm text-gray-500">Ø {criterion.label}</div>

            <div className="text-4xl font-black mt-2">
              {avgByCriterion(criterion.key).toFixed(1)}
            </div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        {ranking.slice(0, 3).map((item, index) => (
          <div
            key={item.id}
            className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6"
          >
            <div className="text-sm text-gray-500">
              Höchste Nutzbarkeit #{index + 1}
            </div>

            <h3 className="text-2xl font-black mt-2">{item.competitor}</h3>

            <p className="text-gray-600">{item.group_name}</p>

            <div className="text-5xl font-black text-[#c3002f] mt-5">
              {averageRating(item).toFixed(1)}
            </div>

            <div className="text-sm text-gray-500">
              Durchschnitt von 5 Punkten
            </div>

            <div className="mt-5 border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-500">
                Persönliches Transfer-Learning
              </div>

              <p className="font-semibold mt-1 whitespace-pre-wrap">
                {item.learning || "Noch kein Learning eingetragen"}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-200">
          <div className="uppercase tracking-[0.25em] text-xs font-bold text-[#c3002f]">
            Gruppenergebnisse
          </div>

          <h3 className="text-3xl font-black mt-2">
            Strukturierte Market-Safari-Ergebnisse
          </h3>

          <p className="text-gray-600 mt-2">
            Gegenüberstellung der eingegebenen Beobachtungen aus Verkäufersicht.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-[#111] text-white">
                <th className="p-5 text-base">Gruppe</th>
                <th className="p-5 text-base">Anbieter</th>

                {questions.map((question) => (
                  <th key={question.key} className="p-5 text-base min-w-[260px]">
                    {question.title}
                  </th>
                ))}

                <th className="p-5 text-base min-w-[260px]">
                  Persönliches Transfer-Learning
                </th>

                <th className="p-5 text-base">Ø Bewertung</th>
              </tr>
            </thead>

            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Noch keine Ergebnisse vorhanden.
                  </td>
                </tr>
              ) : (
                submissions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 align-top"
                  >
                    <td className="p-5 font-bold bg-gray-50">
                      {item.group_name}
                    </td>

                    <td className="p-5 font-bold">{item.competitor}</td>

                    {questions.map((question) => (
                      <td
                        key={question.key}
                        className="p-5 whitespace-pre-wrap text-sm"
                      >
                        {item[question.key] || "—"}
                      </td>
                    ))}

                    <td className="p-5 whitespace-pre-wrap font-semibold">
                      {item.learning || "—"}
                    </td>

                    <td className="p-5 text-2xl font-black text-[#c3002f]">
                      {averageRating(item).toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-[#111] text-white rounded-[32px] shadow-sm p-6 md:p-8">
        <div className="uppercase tracking-[0.25em] text-xs font-bold text-red-300">
          20-Minuten-Auswertung
        </div>

        <h3 className="text-3xl font-black mt-3">Moderationsfragen</h3>

        <div className="grid md:grid-cols-3 gap-5 mt-6">
          <div className="bg-white/10 rounded-3xl p-5">
            <div className="text-3xl font-black text-red-300">1</div>
            <p className="font-bold text-xl mt-3">
              Welche Zielgruppen wurden besonders sichtbar angesprochen?
            </p>
          </div>

          <div className="bg-white/10 rounded-3xl p-5">
            <div className="text-3xl font-black text-red-300">2</div>
            <p className="font-bold text-xl mt-3">
              Welche Vertriebsimpulse lassen sich direkt nutzen?
            </p>
          </div>

          <div className="bg-white/10 rounded-3xl p-5">
            <div className="text-3xl font-black text-red-300">3</div>
            <p className="font-bold text-xl mt-3">
              Was nehmen Sie konkret für Ihre nächste Akquise mit?
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
