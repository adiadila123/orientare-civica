import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Întrebări frecvente — Unde Merg?',
  description: 'Răspunsuri la cele mai frecvente întrebări despre Unde Merg?.',
};

const FAQ_ITEMS = [
  {
    question: 'Este gratuit acest serviciu?',
    answer: 'Da, Unde Merg? este complet gratuit și nu necesită niciun abonament.',
  },
  {
    question: 'Este nevoie de cont pentru a folosi serviciul?',
    answer: 'Nu. Poți descrie problema ta și primi o recomandare fără să creezi un cont.',
  },
  {
    question: 'Ce se întâmplă cu datele mele?',
    answer:
      'Descrierea problemei este trimisă către Groq, un furnizor de inteligență artificială, pentru analiză și nu este asociată cu identitatea ta.',
  },
  {
    question: 'Cât de precisă este recomandarea?',
    answer:
      'Recomandarea este generată automat pe baza descrierii tale. Pentru cazuri complexe, îți recomandăm să confirmi informațiile direct cu instituția indicată.',
  },
  {
    question: 'Ce fac dacă nu găsesc instituția potrivită?',
    answer:
      'Poți contacta linia civică gratuită 0800 008 123 sau te poți adresa primăriei locale pentru îndrumare.',
  },
];

export default function IntrebariFrecventePage() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Întrebări frecvente</h1>
      <dl className="flex flex-col gap-space-md">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
            <dt className="font-title-md text-title-md text-on-surface mb-space-xs">{item.question}</dt>
            <dd className="font-body-sm text-body-sm text-on-surface-variant">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
