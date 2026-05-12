import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dgxjskzvvuhcotaqeyid.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_ILLsjgmMxXyWD-hSzjRFwQ_9PVd8X0o';
const TABLE = 'market_safari_results';

export default function App() {
  const competitors = [
    'Ford Pro', 'Mercedes-Benz Vans', 'Volkswagen Nutzfahrzeuge', 'Renault Pro+', 'MAXUS', 'BYD',
    'Toyota Professional', 'KIA PBV', 'FIAT Professional', 'Opel Nutzfahrzeuge', 'Peugeot Professional',
    'Citroën Business', 'IVECO Daily', 'Nissan Nutzfahrzeuge'
  ];
  const groups = ['Gruppe 1', 'Gruppe 2', 'Gruppe 3', 'Gruppe 4', 'Gruppe 5'];
  const questions = [
    { key: 'branche', title: 'Welche Zielbranche adressiert dieser OEM?', hint: 'z. B. Handwerk, Logistik, Kommune, Serviceflotten' },
    { key: 'usecases', title: 'Welche Anwendungsfälle stehen sichtbar im Fokus?', hint: 'z. B. mobile Werkstatt, City-Logistik, Kühltransport' },
    { key: 'segmente', title: 'Welche Flotten- oder Gewerbesegmente werden offensiv angesprochen?', hint: 'z. B. Handwerk, KEP, Kommune, Großkunden' },
    { key: 'chance', title: 'Wo liegen weiße Flecken, die Nissan besetzen könnte?', hint: 'Welche Chancen oder strategischen Lücken erkennt ihr?' },
  ];
  const ratingCriteria = [
    { key: 'rating_professionalitaet', label: 'Professioneller Messeauftritt', left: 'schwach', right: 'sehr stark' },
    { key: 'rating_innovation', label: 'Innovationsgrad / Zukunftswirkung', left: 'klassisch', right: 'sehr innovativ' },
    { key: 'rating_vertriebslogik', label: 'Business- & Vertriebslogik', left: 'fahrzeugorientiert', right: 'lösungsorientiert' },
  ];
  const initialAnswers = Object.fromEntries(questions.map(q => [q.key, '']));
  const initialRatings = Object.fromEntries(ratingCriteria.map(r => [r.key, 3]));

  const [view, setView] = useState('participant');
  const [sessionName, setSessionName] = useState('IAA Market Safari');
  const [selectedGroup, setSelectedGroup] = useState('Gruppe 1');
  const [selectedCompetitor, setSelectedCompetitor] = useState('Ford Pro');
  const [answers, setAnswers] = useState(initialAnswers);
  const [learning, setLearning] = useState('');
  const [ratings, setRatings] = useState(initialRatings);
  const [submitted, setSubmitted] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

  async function fetchResults() {
    try {
      setLoading(true);
      const url = `${SUPABASE_URL}/rest/v1/${TABLE}?session_name=eq.${encodeURIComponent(sessionName)}&select=*&order=created_at.desc`;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Ergebnisse konnten nicht geladen werden.');
      const data = await response.json();
      setSubmissions(data || []);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error.message || 'Fehler beim Laden der Ergebnisse.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResults();
    if (view === 'trainer') {
      const interval = setInterval(fetchResults, 4000);
      return () => clearInterval(interval);
    }
  }, [view, sessionName]);

  async function submitResult() {
    try {
      setLoading(true); setStatusMessage('');
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
        method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Absenden fehlgeschlagen. Bitte erneut versuchen.');
      setSubmitted(true); await fetchResults();
    } catch (error) {
      setStatusMessage(error.message || 'Fehler beim Absenden.');
    } finally { setLoading(false); }
  }

  async function resetAllSubmissions() {
    const ok = window.confirm('Alle Ergebnisse dieser Session wirklich löschen?');
    if (!ok) return;
    try {
      setLoading(true); setStatusMessage('');
      const url = `${SUPABASE_URL}/rest/v1/${TABLE}?session_name=eq.${encodeURIComponent(sessionName)}`;
      const response = await fetch(url, { method: 'DELETE', headers });
      if (!response.ok) throw new Error('Löschen fehlgeschlagen.');
      await fetchResults();
    } catch (error) {
      setStatusMessage(error.message || 'Fehler beim Löschen.');
    } finally { setLoading(false); }
  }

  const resetParticipantForm = () => { setAnswers(initialAnswers); setLearning(''); setRatings(initialRatings); setSubmitted(false); setStatusMessage(''); };
  const averageRating = (item) => ([Number(item.rating_professionalitaet || 0), Number(item.rating_innovation || 0), Number(item.rating_vertriebslogik || 0)].reduce((a,b)=>a+b,0) / 3);
  const ranking = useMemo(() => [...submissions].sort((a, b) => averageRating(b) - averageRating(a)), [submissions]);
  const avgByCriterion = (key) => submissions.length ? submissions.map(s => Number(s[key] || 0)).reduce((a,b)=>a+b,0) / submissions.length : 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111]">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <header className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#c3002f] h-2 w-full" />
          <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center font-black text-xs">NISSAN</div>
                <div className="uppercase tracking-[0.3em] text-xs font-bold text-[#c3002f]">Nissan Internal</div>
              </div>
              <h1 className="text-3xl md:text-5xl font-black mt-3 leading-tight">IAA Market Safari</h1>
              <p className="text-gray-600 mt-3 text-base md:text-lg max-w-2xl">Guided Competitive Learning · Nutzfahrzeuge bis 3,5 t · Markt verstehen statt Fahrzeuge vergleichen</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setView('participant')} className={`px-5 py-3 rounded-2xl font-bold ${view === 'participant' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>Teilnehmer</button>
              <button onClick={() => setView('trainer')} className={`px-5 py-3 rounded-2xl font-bold ${view === 'trainer' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>Trainer Dashboard</button>
            </div>
          </div>
        </header>

        {statusMessage && <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 font-semibold">{statusMessage}</div>}

        {view === 'participant' && (
          <main className="grid lg:grid-cols-[380px_1fr] gap-6">
            <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 space-y-6 h-fit">
              <div><div className="text-sm uppercase tracking-widest font-bold text-[#c3002f]">Setup</div><h2 className="text-2xl font-bold mt-2">Gruppe & Wettbewerber</h2></div>
              <div><label className="block font-semibold mb-2 text-sm">Session</label><input className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50 text-lg" value={sessionName} onChange={(e) => setSessionName(e.target.value)} /></div>
              <div><label className="block font-semibold mb-2 text-sm">Gruppe</label><select className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50 text-lg" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>{groups.map(g => <option key={g}>{g}</option>)}</select></div>
              <div><label className="block font-semibold mb-2 text-sm">Wettbewerber</label><select className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50 text-lg" value={selectedCompetitor} onChange={(e) => setSelectedCompetitor(e.target.value)}>{competitors.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="bg-[#111] text-white rounded-[28px] p-6"><div className="text-sm text-gray-300">Safari Ablauf</div><div className="space-y-3 mt-4 text-lg"><div>⏱ 45–60 Minuten auf der Messe</div><div>📱 Stichpunkte direkt am Handy</div><div>🎯 Fokus auf Markt & Wettbewerb</div><div>💡 Chancen für Nissan erkennen</div></div></div>
            </section>

            {!submitted ? (
              <section className="space-y-5">
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 md:p-8"><div className="uppercase tracking-[0.25em] text-xs font-bold text-[#c3002f]">Beobachtungsauftrag</div><h2 className="text-3xl md:text-4xl font-black mt-3">{selectedGroup}: {selectedCompetitor}</h2><p className="text-gray-600 mt-3 text-lg">Keine langen Texte. Nur kurze Beobachtungen aus Verkäufersicht.</p></div>
                {questions.map((q, index) => <div key={q.key} className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 md:p-8"><div className="flex items-start gap-4"><div className="min-w-[52px] h-[52px] rounded-2xl bg-[#c3002f] text-white flex items-center justify-center text-2xl font-black">{index + 1}</div><div className="flex-1"><h3 className="text-2xl font-bold leading-snug">{q.title}</h3><p className="text-gray-500 mt-2 text-base">{q.hint}</p></div></div><textarea placeholder="Antworten als Stichpunkte eintragen …" className="mt-6 w-full min-h-[130px] rounded-[24px] border border-gray-300 bg-gray-50 p-5 text-lg focus:outline-none focus:ring-2 focus:ring-[#c3002f]" value={answers[q.key]} onChange={(e) => setAnswers(prev => ({...prev, [q.key]: e.target.value}))} /></div>)}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 md:p-8"><div className="uppercase tracking-[0.25em] text-xs font-bold text-[#c3002f]">Kurze Bewertung</div><h3 className="text-3xl font-black mt-3">Wie stark wirkt dieser Wettbewerber?</h3><div className="space-y-7 mt-7">{ratingCriteria.map(r => <div key={r.key}><div className="flex justify-between items-end gap-4"><label className="text-xl font-bold">{r.label}</label><div className="text-3xl font-black text-[#c3002f]">{ratings[r.key]}</div></div><input type="range" min="1" max="5" value={ratings[r.key]} onChange={(e) => setRatings(prev => ({...prev, [r.key]: Number(e.target.value)}))} className="w-full mt-3 accent-[#c3002f]" /><div className="flex justify-between text-sm text-gray-500 mt-1"><span>{r.left}</span><span>{r.right}</span></div></div>)}</div></div>
                <div className="bg-gradient-to-br from-[#111] to-[#1e1e1e] text-white rounded-[32px] shadow-sm p-6 md:p-8"><div className="uppercase tracking-[0.25em] text-xs font-bold text-red-300">Wichtigstes Learning</div><h3 className="text-3xl font-black mt-3 leading-snug">Was sollte Nissan aus dieser Beobachtung lernen?</h3><textarea placeholder="Wichtigste Erkenntnis für Nissan …" className="mt-6 w-full min-h-[120px] rounded-[24px] border border-gray-700 bg-[#2b2b2b] p-5 text-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" value={learning} onChange={(e) => setLearning(e.target.value)} /><div className="flex justify-end mt-6"><button onClick={submitResult} disabled={loading} className="bg-[#c3002f] disabled:bg-gray-500 hover:bg-[#a10027] transition-colors text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-lg">{loading ? 'Wird gesendet …' : 'Ergebnisse absenden'}</button></div></div>
              </section>
            ) : (
              <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8 md:p-12 text-center h-fit"><div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">✓</div><h2 className="text-3xl md:text-5xl font-black mt-6">Danke!</h2><p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">Eure Ergebnisse wurden gespeichert. Ihr könnt jetzt zur Gruppe zurückkehren.</p><button onClick={resetParticipantForm} className="mt-8 bg-black text-white text-lg font-bold px-8 py-4 rounded-2xl">Neue Eingabe starten</button></section>
            )}
          </main>
        )}

        {view === 'trainer' && (
          <main className="space-y-6">
            <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6 md:p-8"><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><div className="uppercase tracking-[0.25em] text-xs font-bold text-[#c3002f]">Trainer Dashboard</div><h2 className="text-3xl md:text-5xl font-black mt-3">Live-Auswertung</h2><p className="text-gray-600 mt-3 text-lg">Ergebnisse nur für Trainer · max. 20 Minuten Diskussion im Raum</p></div><div className="flex gap-2 flex-wrap"><button onClick={fetchResults} className="bg-black text-white font-bold px-6 py-3 rounded-2xl">Aktualisieren</button><button onClick={resetAllSubmissions} className="bg-[#c3002f] text-white font-bold px-6 py-3 rounded-2xl">Ergebnisse löschen</button></div></div></section>
            <section className="bg-white rounded-[28px] shadow-sm border border-gray-200 p-5"><label className="block font-semibold mb-2 text-sm">Session anzeigen</label><input className="w-full rounded-2xl border border-gray-300 p-4 bg-gray-50 text-lg" value={sessionName} onChange={(e) => setSessionName(e.target.value)} /></section>
            <section className="grid md:grid-cols-4 gap-4"><div className="bg-white rounded-[28px] shadow-sm border border-gray-200 p-5"><div className="text-sm text-gray-500">Eingaben</div><div className="text-4xl font-black mt-2">{submissions.length}</div></div>{ratingCriteria.map(r => <div key={r.key} className="bg-white rounded-[28px] shadow-sm border border-gray-200 p-5"><div className="text-sm text-gray-500">Ø {r.label}</div><div className="text-4xl font-black mt-2">{avgByCriterion(r.key).toFixed(1)}</div></div>)}</section>
            <section className="grid lg:grid-cols-3 gap-5">{ranking.slice(0, 3).map((item, index) => <div key={item.id} className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-6"><div className="text-sm text-gray-500">Stärkste Bewertung #{index + 1}</div><h3 className="text-2xl font-black mt-2">{item.competitor}</h3><p className="text-gray-600">{item.group_name}</p><div className="text-5xl font-black text-[#c3002f] mt-5">{averageRating(item).toFixed(1)}</div><div className="text-sm text-gray-500">Durchschnitt von 5 Punkten</div><div className="mt-5 border-t border-gray-200 pt-4"><div className="text-sm text-gray-500">Learning</div><p className="font-semibold mt-1 whitespace-pre-wrap">{item.learning || 'Noch kein Learning eingetragen'}</p></div></div>)}</section>
            <section className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden"><div className="p-6 md:p-8 border-b border-gray-200"><h3 className="text-3xl font-black">Strukturierter Wettbewerbsvergleich</h3><p className="text-gray-600 mt-2">Antworten der Gruppen aus Verkäufersicht.</p></div><div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[1200px]"><thead><tr className="bg-[#111] text-white"><th className="p-5 text-base">Gruppe</th><th className="p-5 text-base">Wettbewerber</th>{questions.map(q => <th key={q.key} className="p-5 text-base min-w-[260px]">{q.title}</th>)}<th className="p-5 text-base min-w-[260px]">Learning für Nissan</th><th className="p-5 text-base">Ø Bewertung</th></tr></thead><tbody>{submissions.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-gray-500">Noch keine Ergebnisse vorhanden.</td></tr> : submissions.map(item => <tr key={item.id} className="border-b border-gray-200 align-top"><td className="p-5 font-bold bg-gray-50">{item.group_name}</td><td className="p-5 font-bold">{item.competitor}</td>{questions.map(q => <td key={q.key} className="p-5 whitespace-pre-wrap text-sm">{item[q.key] || <span className="text-gray-400">—</span>}</td>)}<td className="p-5 whitespace-pre-wrap font-semibold">{item.learning || '—'}</td><td className="p-5 text-2xl font-black text-[#c3002f]">{averageRating(item).toFixed(1)}</td></tr>)}</tbody></table></div></section>
            <section className="bg-[#111] text-white rounded-[32px] shadow-sm p-6 md:p-8"><div className="uppercase tracking-[0.25em] text-xs font-bold text-red-300">20-Minuten-Auswertung</div><h3 className="text-3xl font-black mt-3">Moderationsfragen</h3><div className="grid md:grid-cols-3 gap-5 mt-6"><div className="bg-white/10 rounded-3xl p-5"><div className="text-3xl font-black text-red-300">1</div><p className="font-bold text-xl mt-3">Welche Branchen wurden am stärksten sichtbar?</p></div><div className="bg-white/10 rounded-3xl p-5"><div className="text-3xl font-black text-red-300">2</div><p className="font-bold text-xl mt-3">Wer verkauft am stärksten Business-Lösungen statt Fahrzeuge?</p></div><div className="bg-white/10 rounded-3xl p-5"><div className="text-3xl font-black text-red-300">3</div><p className="font-bold text-xl mt-3">Wo liegen die größten Chancen für Nissan?</p></div></div></section>
          </main>
        )}
      </div>
    </div>
  );
}
